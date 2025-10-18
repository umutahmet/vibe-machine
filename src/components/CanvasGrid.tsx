import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { useCanvasInteractions } from "../hooks/useCanvasInteractions";
import type { Tool } from "../lib/tools";
import type { Pattern } from "../types";
import { drawGridBody } from "./CanvasGridBody";
import { drawHits } from "./CanvasHits";
import { drawRuler } from "./CanvasRuler";

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

	// Sync playhead with Tone.Transport for real-time audio position
	useEffect(() => {
		let raf = 0;
		const tick = () => {
			const seconds = Tone.Transport.seconds;
			const beats = seconds * (pattern.bpm / 60);
			setPlayhead(beats);
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
		// only depends on bpm
	}, [pattern.bpm]);

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
		ctx.fillStyle = "#ff0000";
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
