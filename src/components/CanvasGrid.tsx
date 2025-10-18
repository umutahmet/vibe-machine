import { useEffect, useMemo, useRef } from "react";
import { useCanvasInteractions } from "../hooks/useCanvasInteractions";
import { useSmoothedPlayhead } from "../hooks/useSmoothedPlayhead";
import type { Tool } from "../lib/tools";
import type { Pattern } from "../types";
// rendering delegated to ./canvasRenderer
import { RULER_HEIGHT, TRACK_HEIGHT } from "./canvasConstants";
import { renderCanvas } from "./canvasRenderer";

type GridProps = {
	pattern: Pattern;
	tool?: Tool;
	onAddHit?: (track: string, position: number) => void;
	onRemoveHit?: (track: string, position: number) => void;
	onMoveHit?: (track: string, from: number, to: number) => void;
	onSetLoop?: (loop: { enabled: boolean; start: number; end: number }) => void;
};

export default function CanvasGrid({
	pattern,
	tool = "arrow",
	onAddHit,
	onRemoveHit,
	onMoveHit,
	onSetLoop,
}: GridProps) {
	const ref = useRef<HTMLCanvasElement | null>(null);
	const playhead = useSmoothedPlayhead(pattern);

	// Memoized derived values to avoid recalculation on every render
	const tracks = useMemo(() => Object.keys(pattern.tracks), [pattern.tracks]);
	const steps = useMemo(() => pattern.bars * 16, [pattern.bars]);
	const rulerHeight = RULER_HEIGHT;
	const trackHeight = TRACK_HEIGHT;
	const gridHeight = useMemo(
		() => trackHeight * tracks.length,
		[tracks.length, trackHeight],
	);

	// Sync playhead with Tone.Transport for real-time audio position.
	// Use Transport.position ("bars:quarters:sixteenths") and parse it into
	// quarter-note beats so that changing the tempo (bpm) doesn't move the
	// playhead unexpectedly. Transport.seconds would change with bpm which
	// caused the observed jump.
	useEffect(() => {
		let raf = 0;

		const tick = () => {
			try {
				const currentSeconds = Tone.Transport.seconds;
				const currentBpm = Tone.Transport.bpm?.value || pattern.bpm;

				// If BPM changed since last frame, rebase our interpolation to the
				// exact Transport.position to avoid jumps.
				if (currentBpm !== lastBpmRef.current) {
					lastBpmRef.current = currentBpm;
					lastSecondsRef.current = currentSeconds;
					// rebase lastBeat from transport seconds (high-resolution) so we
					// don't snap to coarse Transport.position formats.
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

				// Compute interpolated beats since last baseline using last known BPM
				const deltaSeconds = currentSeconds - lastSecondsRef.current;
				let interpBeats =
					lastBeatRef.current + deltaSeconds * (lastBpmRef.current / 60);

				// Occasionally correct drift: if transport.position differs from our
				// interpolated value by more than a small threshold, rebase to avoid
				// long-term drift (e.g. due to audio timing adjustments).
				// Use high-resolution seconds-based position for drift correction.
				const actualPosBeats = Tone.Transport.seconds * (currentBpm / 60);
				// apply same loop wrapping to the actual position
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
					// large drift -> rebase baseline
					lastBeatRef.current = actualWrapped;
					lastSecondsRef.current = currentSeconds;
					interpBeats = actualWrapped;
				}

				// Update refs for next frame (but keep baseline unless rebased above)
				// Do not update lastBeatRef here — it represents the baseline at
				// lastSecondsRef. We update lastSecondsRef to current for continuous
				// interpolation so deltaSeconds remains small.
				lastSecondsRef.current = currentSeconds;

				// Loop-aware smoothing: update smoothedPlayheadRef towards interpBeats
				// taking the shortest path across loop boundaries when looping.
				const applySmoothing = (target: number) => {
					const current = smoothedPlayheadRef.current;
					if (pattern.loop?.enabled) {
						const loopStart = (pattern.loop.start || 0) * 4;
						const loopEnd = (pattern.loop.end || pattern.bars) * 4;
						const loopLen = Math.max(0, loopEnd - loopStart);
						if (loopLen > 0) {
							// Map both current and target to [0, loopLen)
							const curRel =
								(((current - loopStart) % loopLen) + loopLen) % loopLen;
							const tgtRel =
								(((target - loopStart) % loopLen) + loopLen) % loopLen;
							// Compute shortest delta in wrapped space
							let delta = tgtRel - curRel;
							if (delta > loopLen / 2) delta -= loopLen;
							if (delta < -loopLen / 2) delta += loopLen;
							const newRel = curRel + delta * SMOOTHING_ALPHA;
							smoothedPlayheadRef.current =
								loopStart + (((newRel % loopLen) + loopLen) % loopLen);
							return;
						}
					}

					// Non-looping smoothing: simple exponential smoothing
					smoothedPlayheadRef.current =
						current + (target - current) * SMOOTHING_ALPHA;
				};

				// If transport is playing, apply smoothing only on the x-axis movement.
				// When not playing (stopped/paused), snap the playhead to the transport
				// to avoid enter/exit animations.
				// Treat 'paused' as still wanting a smooth transition; only snap when
				// fully stopped. This preserves the pause animation while keeping
				// Enter/stop snapping behavior.
				const transportState = Tone.Transport.state;
				const shouldSmooth = transportState !== "stopped";
				if (shouldSmooth) {
					applySmoothing(interpBeats);
					setPlayhead(smoothedPlayheadRef.current);
				} else {
					// snap to actual wrapped position and rebase interpolation baseline
					smoothedPlayheadRef.current = actualWrapped;
					lastBeatRef.current = actualWrapped;
					lastSecondsRef.current = currentSeconds;
					setPlayhead(actualWrapped);
				}
			} catch {
				// fallback: keep previous playhead
			}
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
		// depends on nothing that would change the parsing logic other than pattern
		// Re-create the RAF loop when loop boundaries or pattern length change.
	}, [
		pattern.bars,
		pattern.loop?.enabled,
		pattern.loop?.start,
		pattern.loop?.end,
		pattern.bpm,
	]);

	// Main rendering effect: draw the grid, ruler, and hits
	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		renderCanvas(
			canvas,
			pattern,
			playhead,
			tracks,
			steps,
			gridHeight,
			rulerHeight,
			trackHeight,
		);
	}, [pattern, playhead, tracks, steps, gridHeight, rulerHeight, trackHeight]);

	// Handle user interactions (pointer events) via custom hook
	useCanvasInteractions(
		ref,
		pattern,
		tool,
		tracks,
		steps,
		rulerHeight,
		trackHeight,
		onAddHit,
		onRemoveHit,
		onMoveHit,
		onSetLoop,
	);

	// Render track headers aligned under the ruler and styled via CSS
	return (
		<div className="canvas-with-headers">
			<div className="grid-lane-headers">
				{tracks.map((trackName, idx) => (
					<div className="grid-lane-item" key={trackName}>
						<div className="grid-lane-number">{idx + 1}</div>
						<div className="grid-lane-title">{trackName}</div>
					</div>
				))}
			</div>
			<div className="canvas-column">
				<canvas ref={ref} className="vibe-canvas" />
			</div>
		</div>
	);
}
