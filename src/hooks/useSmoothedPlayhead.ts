import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { SMOOTHING_ALPHA } from "../components/canvasConstants";
import type { Pattern } from "../types";

/**
 * Hook that returns a smoothed playhead position (in quarter-note beats)
 * synchronized to Tone.Transport. It preserves loop wrapping and smooths
 * motion using exponential smoothing.
 */
export function useSmoothedPlayhead(pattern: Pattern) {
	const [playhead, setPlayhead] = useState<number>(0);

	const lastSecondsRef = useRef<number>(Tone.Transport.seconds || 0);
	const lastBeatRef = useRef<number>(0);
	const lastBpmRef = useRef<number>(
		Tone.Transport.bpm?.value || pattern.bpm || 120,
	);
	const smoothedPlayheadRef = useRef<number>(0);

	useEffect(() => {
		let raf = 0;

		const tick = () => {
			try {
				const currentSeconds = Tone.Transport.seconds;
				const currentBpm = Tone.Transport.bpm?.value || pattern.bpm || 120;

				if (currentBpm !== lastBpmRef.current) {
					lastBpmRef.current = currentBpm;
					lastSecondsRef.current = currentSeconds;
					lastBeatRef.current = currentSeconds * (currentBpm / 60);
					if (pattern.loop?.enabled) {
						const loopStartBeats = (pattern.loop.start || 0) * 4;
						const loopEndBeats = (pattern.loop.end || pattern.bars) * 4;
						const loopLength = Math.max(0, loopEndBeats - loopStartBeats);
						if (loopLength > 0) {
							let rel = lastBeatRef.current - loopStartBeats;
							rel = ((rel % loopLength) + loopLength) % loopLength;
							lastBeatRef.current = loopStartBeats + rel;
						}
					}
				}

				const deltaSeconds = currentSeconds - lastSecondsRef.current;
				let interpBeats =
					lastBeatRef.current + deltaSeconds * (lastBpmRef.current / 60);

				const actualPosBeats = Tone.Transport.seconds * (currentBpm / 60);
				let actualWrapped = actualPosBeats;
				if (pattern.loop?.enabled) {
					const loopStartBeats = (pattern.loop.start || 0) * 4;
					const loopEndBeats = (pattern.loop.end || pattern.bars) * 4;
					const loopLength = Math.max(0, loopEndBeats - loopStartBeats);
					if (loopLength > 0) {
						let rel = actualWrapped - loopStartBeats;
						rel = ((rel % loopLength) + loopLength) % loopLength;
						actualWrapped = loopStartBeats + rel;
					}
				}

				const drift = Math.abs(interpBeats - actualWrapped);
				if (drift > 0.25) {
					lastBeatRef.current = actualWrapped;
					lastSecondsRef.current = currentSeconds;
					interpBeats = actualWrapped;
				}

				lastSecondsRef.current = currentSeconds;

				const applySmoothing = (target: number) => {
					const current = smoothedPlayheadRef.current;
					if (pattern.loop?.enabled) {
						const loopStart = (pattern.loop.start || 0) * 4;
						const loopEnd = (pattern.loop.end || pattern.bars) * 4;
						const loopLen = Math.max(0, loopEnd - loopStart);
						if (loopLen > 0) {
							const curRel =
								(((current - loopStart) % loopLen) + loopLen) % loopLen;
							const tgtRel =
								(((target - loopStart) % loopLen) + loopLen) % loopLen;
							let delta = tgtRel - curRel;
							if (delta > loopLen / 2) delta -= loopLen;
							if (delta < -loopLen / 2) delta += loopLen;
							const newRel = curRel + delta * SMOOTHING_ALPHA;
							smoothedPlayheadRef.current =
								loopStart + (((newRel % loopLen) + loopLen) % loopLen);
							return;
						}
					}
					smoothedPlayheadRef.current =
						current + (target - current) * SMOOTHING_ALPHA;
				};

				const transportState = Tone.Transport.state;
				const shouldSmooth = transportState !== "stopped";
				if (shouldSmooth) {
					applySmoothing(interpBeats);
					setPlayhead(smoothedPlayheadRef.current);
				} else {
					smoothedPlayheadRef.current = actualWrapped;
					lastBeatRef.current = actualWrapped;
					lastSecondsRef.current = currentSeconds;
					setPlayhead(actualWrapped);
				}
			} catch {
				// no-op on error
			}
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [
		pattern.bars,
		pattern.loop?.enabled,
		pattern.loop?.start,
		pattern.loop?.end,
		pattern.bpm,
	]);

	return playhead;
}
