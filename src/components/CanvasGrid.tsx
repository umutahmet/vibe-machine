import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import type { Tool } from "../lib/tools";
import type { Pattern } from "../types";
import { drawGridBody } from "./CanvasGridBody";
import { drawHits } from "./CanvasHits";
import { computeBarFromX, getLoopHandleAtPosition } from "./CanvasLoopHandles";
import { drawRuler } from "./CanvasRuler";
import { handleArrowTool, handlePencilTool } from "./CanvasTools";

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

	// interaction state
	const dragState = useRef<
		| {
				track: string;
				original: number;
				index?: number;
		  }
		| {
				type: "loop-start" | "loop-end";
				original: number;
		  }
		| null
	>(null);

	// RAF loop to sync playhead with Tone.Transport
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

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const rulerHeight = 30;
		const trackHeight = 25; // fixed lane height
		const tracks = Object.keys(pattern.tracks);
		const gridHeight = trackHeight * tracks.length;
		canvas.width = canvas.clientWidth || 800;
		const width = canvas.width;
		canvas.height = rulerHeight + gridHeight;
		canvas.style.height = canvas.height + "px";
		ctx.clearRect(0, 0, width, canvas.height);

		const steps = pattern.bars * 16;

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

		// playhead (optional, since we have highlight)
		// ctx.fillStyle = "#ff0000";
		// const px = ((playhead % (pattern.bars * 4)) / (pattern.bars * 4)) * width;
		// ctx.fillRect(px, 0, 2, height);
	}, [pattern, playhead]);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const rulerHeight = 30;
		const trackHeight = 25; // fixed lane height
		const tracks = Object.keys(pattern.tracks);
		const steps = pattern.bars * 16;
		const handlePointerDown = (ev: PointerEvent) => {
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const y = ev.clientY - rect.top;
			const stepIndex = Math.floor((x / canvas.width) * steps);
			const gridY = y - rulerHeight;
			const trackIndex = gridY >= 0 ? Math.floor(gridY / trackHeight) : -1;
			const track =
				trackIndex >= 0 && trackIndex < tracks.length
					? tracks[trackIndex]
					: null;

			// check for loop handle drag
			if (pattern.loop?.enabled && y >= -5 && y <= rulerHeight + 5) {
				const handle = getLoopHandleAtPosition(x, canvas.width, pattern);
				if (handle) {
					dragState.current = {
						type: handle,
						original: pattern.loop[handle === "loop-start" ? "start" : "end"],
					};
					canvas.setPointerCapture(ev.pointerId);
					return;
				}
			}

			if (!track) return;
			if (tool === "pencil") {
				handlePencilTool(pattern, track, stepIndex, onAddHit, onRemoveHit);
			} else if (tool === "arrow") {
				handleArrowTool(pattern, track, stepIndex, dragState, canvas, ev);
			}
		};

		const handlePointerMove = () => {
			// no-op for now; kept for future visual feedback
		};

		const handlePointerUp = (ev: PointerEvent) => {
			if (!dragState.current || !canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const ds = dragState.current;
			dragState.current = null;
			canvas.releasePointerCapture(ev.pointerId);
			if ("type" in ds) {
				// loop drag
				const clampedBar = computeBarFromX(x, canvas.width, pattern.bars);
				const currentLoop = pattern.loop ?? {
					enabled: false,
					start: 0,
					end: pattern.bars,
				};
				if (ds.type === "loop-start") {
					onSetLoop?.({ ...currentLoop, start: clampedBar });
				} else if (ds.type === "loop-end") {
					onSetLoop?.({ ...currentLoop, end: clampedBar });
				}
			} else {
				// hit drag
				const stepIndex = Math.floor((x / canvas.width) * steps);
				const toQuarter = Math.floor(stepIndex / 4) + (stepIndex % 4) / 4;
				onMoveHit?.(ds.track, ds.original, toQuarter);
			}
		};

		canvas.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		return () => {
			canvas.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [pattern, tool, onAddHit, onRemoveHit, onMoveHit, onSetLoop]);

	return <canvas ref={ref} className="vibe-canvas" />;
}
