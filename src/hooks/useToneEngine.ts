import { useEffect, useRef } from "react";
import * as Tone from "tone";
import type { Pattern } from "../types";

function positionToToneTime(position: number) {
	// position is measured in quarter-note beats across bars.
	// Convert to Tone's "bars:quarters:sixteenths" string.
	const bars = Math.floor(position / 4);
	const quarters = Math.floor(position % 4);
	const withinQuarter = position - (bars * 4 + quarters);
	const sixteenths = Math.round(withinQuarter * 4);
	return `${bars}:${quarters}:${sixteenths}`;
}

export function useToneEngine(pattern: Pattern, isPlaying: boolean) {
	const partsRef = useRef<Tone.Part[]>([]);
	// transient synths (created when no sample player exists); disposed each run
	const synthsRef = useRef<
		Record<
			string,
			Tone.Synth | Tone.NoiseSynth | Tone.MembraneSynth | Tone.MetalSynth
		>
	>({});
	// persistent sample players (preloaded once)
	const playersRef = useRef<Record<string, Tone.Player>>({});
	const playersLoadedRef = useRef(false);
	type Disposable = { dispose?: () => void };

	useEffect(() => {
		// cleanup previous parts and transient synths
		partsRef.current.forEach((p) => {
			p.dispose();
		});
		partsRef.current = [];
		Object.values(synthsRef.current).forEach((s) => {
			const d = s as Disposable;
			if (d.dispose) d.dispose();
		});
		synthsRef.current = {};

		const cancelled = false;

		const sampleMap: Record<string, string> = {
			kick: "/drums/kicks/LA_Kick01.wav",
			snare: "/drums/claps-snares/LA_Snare01.wav",
			hat: "/drums/hats/LA_Hat03.wav",
		};

		const ensurePlayers = async () => {
			if (playersLoadedRef.current) return;
			const entries = Object.entries(sampleMap);
			const loaders: Promise<void>[] = [];
			entries.forEach(([name, url]) => {
				try {
					const p = new Tone.Player(url).toDestination();
					playersRef.current[name] = p;
					loaders.push(p.load());
				} catch {
					// ignore load errors, fallback to synths
				}
			});
			try {
				await Promise.all(loaders);
				if (!cancelled) playersLoadedRef.current = true;
			} catch {
				// if some fail, still mark loaded so we don't retry forever
				if (!cancelled) playersLoadedRef.current = true;
			}
		};

		const setup = async () => {
			await ensurePlayers();

			// create instruments per track (use preloaded players when available)
			// collect instrument events across all tracks/blocks
			const instrumentEvents: Record<string, number[]> = {};
			Object.entries(pattern.tracks).forEach(([trackName, tr]) => {
				tr.blocks.forEach((b) => {
					const blockStartQ = b.start * 4;
					// new format: b.hits is an object mapping instrument->positions
					if (b.hits && typeof b.hits === "object" && !Array.isArray(b.hits)) {
						Object.entries(b.hits as Record<string, number[]>).forEach(
							([instr, arr]) => {
								(arr || []).forEach((rel) => {
									const abs = blockStartQ + rel;
									instrumentEvents[instr] = instrumentEvents[instr] || [];
									instrumentEvents[instr].push(abs);
								});
							},
						);
					} else if (Array.isArray(b.hits)) {
						// legacy format: hits array belongs to the track itself (trackName is the instrument)
						(b.hits as number[]).forEach((rel) => {
							const abs = blockStartQ + rel;
							instrumentEvents[trackName] = instrumentEvents[trackName] || [];
							instrumentEvents[trackName].push(abs);
						});
					}
				});
			});

			// create parts per instrument
			Object.entries(instrumentEvents).forEach(([instr, positions]) => {
				let inst:
					| Tone.Synth
					| Tone.NoiseSynth
					| Tone.MembraneSynth
					| Tone.MetalSynth
					| Tone.Player;
				if (playersLoadedRef.current && playersRef.current[instr]) {
					inst = playersRef.current[instr];
				} else {
					switch (instr) {
						case "kick":
							inst = new Tone.MembraneSynth().toDestination();
							break;
						case "snare":
							inst = new Tone.NoiseSynth({ volume: -6 }).toDestination();
							break;
						case "hat":
							inst = new Tone.MetalSynth({
								frequency: 200,
								envelope: { decay: 0.1 },
							}).toDestination();
							break;
						case "bass":
							inst = new Tone.Synth().toDestination();
							break;
						default:
							inst = new Tone.Synth().toDestination();
					}
					// record transient synth for disposal
					synthsRef.current[instr] = inst as
						| Tone.Synth
						| Tone.NoiseSynth
						| Tone.MembraneSynth
						| Tone.MetalSynth;
				}

				const events = positions.map(
					(pos) => [positionToToneTime(pos), pos] as [string, number],
				);
				const part = new Tone.Part((time) => {
					try {
						if ((inst as Tone.Player) instanceof Tone.Player) {
							(inst as Tone.Player).start(time);
						} else if (instr === "snare") {
							(inst as Tone.NoiseSynth).triggerAttackRelease("16n", time);
						} else if (instr === "hat") {
							(inst as Tone.MetalSynth).triggerAttackRelease("32n", time);
						} else if (instr === "kick") {
							(inst as Tone.MembraneSynth).triggerAttackRelease(
								"C1",
								"8n",
								time,
							);
						} else if (instr === "bass") {
							(inst as Tone.Synth).triggerAttackRelease("C2", "8n", time);
						} else {
							(inst as Tone.Synth).triggerAttackRelease("C3", "8n", time);
						}
					} catch {
						// ignore
					}
				}, events);

				part.start(0);
				partsRef.current.push(part);
			});

			// set tempo and looping
			Tone.Transport.bpm.value = pattern.bpm;
			if (pattern.loop?.enabled) {
				Tone.Transport.loop = true;
				Tone.Transport.loopStart = positionToToneTime((pattern.loop.start || 0) * 4);
				Tone.Transport.loopEnd = positionToToneTime((pattern.loop.end || pattern.bars) * 4);
			} else {
				Tone.Transport.loop = true;
				Tone.Transport.loopStart = positionToToneTime(0);
				Tone.Transport.loopEnd = positionToToneTime(pattern.bars * 4);
			}

			// start/stop based on isPlaying
			if (isPlaying) {
				// Ensure AudioContext is resumed/started and wait for players to load
				await Tone.start();
				if (
					Tone.Transport.state === "stopped" ||
					Tone.Transport.state === "paused"
				) {
					Tone.Transport.start();
				}
			} else {
				Tone.Transport.pause();
			}
		};

		// run setup but don't block cleanup
		void setup();

		// previous per-track scheduling removed — scheduling is handled by the async setup above which
		// aggregates instrument events across all track blocks.

		// set tempo and looping
		Tone.Transport.bpm.value = pattern.bpm;
		if (pattern.loop?.enabled) {
			Tone.Transport.loop = true;
			Tone.Transport.loopStart = positionToToneTime((pattern.loop.start || 0) * 4);
			Tone.Transport.loopEnd = positionToToneTime((pattern.loop.end || pattern.bars) * 4);
		} else {
			Tone.Transport.loop = true;
			Tone.Transport.loopStart = positionToToneTime(0);
			Tone.Transport.loopEnd = positionToToneTime(pattern.bars * 4);
		}

		// start/stop based on isPlaying
		if (isPlaying) {
			// Ensure AudioContext is resumed/started
			void Tone.start().then(() => {
				if (
					Tone.Transport.state === "stopped" ||
					Tone.Transport.state === "paused"
				) {
					Tone.Transport.start();
				}
			});
		} else {
			Tone.Transport.pause();
		}

		return () => {
			// mark cancelled so preload doesn't update refs after unmount
			// cleanup transient parts and synths
			partsRef.current.forEach((p) => {
				p.dispose();
			});
			partsRef.current = [];
			Object.values(synthsRef.current).forEach((s) => {
				const d = s as Disposable;
				if (d.dispose) d.dispose();
			});
			synthsRef.current = {};
		};
	}, [pattern, isPlaying]);
}
