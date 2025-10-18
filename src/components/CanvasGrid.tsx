import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { useCanvasInteractions } from "../hooks/useCanvasInteractions";
import type { Tool } from "../lib/tools";
import type { Pattern } from "../types";
import { drawGridBody } from "./CanvasGridBody";
import { drawHits } from "./CanvasHits";
import { drawRuler } from "./CanvasRuler";
import { getCanvasColors } from "./canvasConfig";

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
	const [playhead, setPlayhead] = useState(0);

	// Memoized derived values to avoid recalculation on every render
	const tracks = useMemo(() => Object.keys(pattern.tracks), [pattern.tracks]);
	const steps = useMemo(() => pattern.bars * 16, [pattern.bars]);
	const rulerHeight = 30;
	const trackHeight = 25;
	const gridHeight = useMemo(
		() => trackHeight * tracks.length,
		[tracks.length],
	);

	// Sync playhead with Tone.Transport for real-time audio position.
	// Use Transport.position ("bars:quarters:sixteenths") and parse it into
	// quarter-note beats so that changing the tempo (bpm) doesn't move the
	// playhead unexpectedly. Transport.seconds would change with bpm which
	// caused the observed jump.
	useEffect(() => {
		let raf = 0;

		const parsePositionToBeats = (pos: string) => {
			// Tone.Transport.position has form "bars:quarters:sixteenths".
			// Convert to absolute quarter-note beats.
			// Example: "1:2:3" -> bars * 4 + quarters + sixteenths / 4
			const parts = pos.split(":").map((p) => parseInt(p, 10) || 0);
			const [bars = 0, quarters = 0, sixteenths = 0] = parts;
			return bars * 4 + quarters + sixteenths / 4;
		};

		const tick = () => {
			try {
				const pos = Tone.Transport.position as string;
				let beats = parsePositionToBeats(pos);

				// If looping is enabled, wrap the beats into the loop range so the
				// visual playhead doesn't transiently render past the loop end.
				// pattern.loop.start/end are in bars; convert to beats.
				if (pattern.loop?.enabled) {
					const loopStartBeats = (pattern.loop.start || 0) * 4;
					const loopEndBeats = (pattern.loop.end || pattern.bars) * 4;
					const loopLength = Math.max(0, loopEndBeats - loopStartBeats);
					if (loopLength > 0) {
						// Normalize beats relative to loop start, then mod by loop length
						let rel = beats - loopStartBeats;
						// Use positive modulo
						rel = ((rel % loopLength) + loopLength) % loopLength;
						beats = loopStartBeats + rel;
					}
				}

				setPlayhead(beats);
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
	]);

	// Main rendering effect: draw the grid, ruler, and hits
	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		canvas.width = canvas.clientWidth || 800;
		const width = canvas.width;
		canvas.height = rulerHeight + gridHeight;
		canvas.style.height = `${canvas.height}px`;
		ctx.clearRect(0, 0, width, canvas.height);

		// draw ruler
		drawRuler(ctx, width, playhead, pattern);

		// draw grid below ruler
		const gridY = rulerHeight;
		ctx.save();
		ctx.translate(0, gridY);

		drawGridBody(
			ctx,
			width,
			gridHeight,
			trackHeight,
			tracks,
			pattern,
			playhead,
			steps,
		);

		// draw hits and blocks
		drawHits(ctx, width, steps, tracks, trackHeight, pattern);

		ctx.restore(); // end translate

		// Draw playhead line
		const COLORS = getCanvasColors();
		ctx.fillStyle = COLORS.handleFill || `rgba(var(--accent-gold-rgb), 1)`;
		const px = ((playhead % (pattern.bars * 4)) / (pattern.bars * 4)) * width;
		ctx.fillRect(px, 0, 2, canvas.height);
	}, [pattern, playhead, tracks, steps, gridHeight]);

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

	return <canvas ref={ref} className="vibe-canvas" />;
}
