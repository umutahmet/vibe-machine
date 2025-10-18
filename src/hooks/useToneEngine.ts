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
			hat: "/drums/hats/LA_Hat01.wav",
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
			Object.keys(pattern.tracks).forEach((name) => {
				let inst:
					| Tone.Synth
					| Tone.NoiseSynth
					| Tone.MembraneSynth
					| Tone.MetalSynth
					| Tone.Player;
				if (playersLoadedRef.current && playersRef.current[name]) {
					inst = playersRef.current[name];
				} else {
					switch (name) {
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
					synthsRef.current[name] = inst as
						| Tone.Synth
						| Tone.NoiseSynth
						| Tone.MembraneSynth
						| Tone.MetalSynth;
				}

				// build part events and schedule
				const hits = pattern.tracks[name] || [];
				const events = hits.map((pos) => [positionToToneTime(pos), pos]);

				const part = new Tone.Part(
					(time) => {
						try {
							if ((inst as Tone.Player) instanceof Tone.Player) {
								(inst as Tone.Player).start(time);
							} else if (name === "snare") {
								(inst as Tone.NoiseSynth).triggerAttackRelease("16n", time);
							} else if (name === "hat") {
								(inst as Tone.MetalSynth).triggerAttackRelease("32n", time);
							} else if (name === "kick") {
								(inst as Tone.MembraneSynth).triggerAttackRelease(
									"C1",
									"8n",
									time,
								);
							} else if (name === "bass") {
								(inst as Tone.Synth).triggerAttackRelease("C2", "8n", time);
							} else {
								(inst as Tone.Synth).triggerAttackRelease("C3", "8n", time);
							}
						} catch {
							// ignore
						}
					},
					events as unknown as Array<[string, number]>,
				);

				part.start(0);
				partsRef.current.push(part);
			});

			// set tempo and looping
			Tone.Transport.bpm.value = pattern.bpm;
			if (pattern.loop?.enabled) {
				Tone.Transport.loop = true;
				Tone.Transport.loopStart = `${pattern.loop.start}m`;
				Tone.Transport.loopEnd = `${pattern.loop.end}m`;
			} else {
				Tone.Transport.loop = true;
				Tone.Transport.loopStart = `0m`;
				Tone.Transport.loopEnd = `${pattern.bars}m`;
			}

			// start/stop based on isPlaying
			if (isPlaying) {
				// Ensure AudioContext is resumed/started and wait for players to load
				await Tone.start();
				if (!Tone.Transport.state || Tone.Transport.state === "stopped") {
					Tone.Transport.start();
				}
			} else {
				Tone.Transport.stop();
			}
		};

		// run setup but don't block cleanup
		void setup();

		// create instruments per track
		Object.keys(pattern.tracks).forEach((name) => {
			let inst:
				| Tone.Synth
				| Tone.NoiseSynth
				| Tone.MembraneSynth
				| Tone.MetalSynth
				| Tone.Player;
			switch (name) {
				case "kick":
					// prefer sample player if a kick sample exists in public/drums/kicks
					inst = new Tone.Player(`/drums/kicks/LA_Kick01.wav`).toDestination();
					break;
				case "snare":
					inst = new Tone.Player(
						`/drums/claps-snares/LA_Snare01.wav`,
					).toDestination();
					break;
				case "hat":
					inst = new Tone.Player(`/drums/hats/LA_Hat01.wav`).toDestination();
					break;
				case "bass":
					inst = new Tone.Synth().toDestination();
					break;
				default:
					inst = new Tone.Synth().toDestination();
			}
			synthsRef.current[name] = inst;

			const hits = pattern.tracks[name] || [];
			// build part events: time string and the hit position value
			const events = hits.map((pos) => [positionToToneTime(pos), pos]);

			const part = new Tone.Part(
				(time) => {
					try {
						if (name === "snare") {
							// NoiseSynth uses triggerAttackRelease with duration
							inst.triggerAttackRelease("16n", time);
						} else if (name === "hat") {
							inst.triggerAttackRelease("32n", time);
						} else if (name === "kick") {
							inst.triggerAttackRelease("C1", "8n", time);
						} else if (name === "bass") {
							inst.triggerAttackRelease("C2", "8n", time);
						} else {
							inst.triggerAttackRelease("C3", "8n", time);
						}
					} catch {
						// ignore scheduling errors in the hook
					}
				},
				events as unknown as Array<[string, number]>,
			);

			part.start(0);
			partsRef.current.push(part);
		});

		// set tempo and looping
		Tone.Transport.bpm.value = pattern.bpm;
		if (pattern.loop?.enabled) {
			Tone.Transport.loop = true;
			Tone.Transport.loopStart = `${pattern.loop.start}m`;
			Tone.Transport.loopEnd = `${pattern.loop.end}m`;
		} else {
			Tone.Transport.loop = true;
			Tone.Transport.loopStart = `0m`;
			Tone.Transport.loopEnd = `${pattern.bars}m`;
		}

		// start/stop based on isPlaying
		if (isPlaying) {
			// Ensure AudioContext is resumed/started
			void Tone.start().then(() => {
				if (!Tone.Transport.state || Tone.Transport.state === "stopped") {
					Tone.Transport.start();
				}
			});
		} else {
			Tone.Transport.stop();
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
