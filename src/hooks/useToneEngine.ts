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
	const synthsRef = useRef<
		Record<
			string,
			Tone.Synth | Tone.NoiseSynth | Tone.MembraneSynth | Tone.MetalSynth
		>
	>({});
	type Disposable = { dispose?: () => void };

	useEffect(() => {
		// cleanup previous
		partsRef.current.forEach((p) => p.dispose());
		partsRef.current = [];
		Object.values(synthsRef.current).forEach((s) => {
			const d = s as Disposable;
			if (d.dispose) d.dispose();
		});
		synthsRef.current = {};

		// create instruments per track
		Object.keys(pattern.tracks).forEach((name) => {
			let inst:
				| Tone.Synth
				| Tone.NoiseSynth
				| Tone.MembraneSynth
				| Tone.MetalSynth;
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
		Tone.Transport.loop = true;
		Tone.Transport.loopEnd = `${pattern.bars}m`;

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
			partsRef.current.forEach((p) => p.dispose());
			partsRef.current = [];
			Object.values(synthsRef.current).forEach((s) => {
				const d = s as Disposable;
				if (d.dispose) d.dispose();
			});
			synthsRef.current = {};
		};
	}, [pattern, isPlaying]);
}
