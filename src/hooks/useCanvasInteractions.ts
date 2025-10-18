import { useEffect, useRef } from "react";
import {
	computeBarFromX,
	getLoopHandleAtPosition,
} from "../components/CanvasLoopHandles";
import { handleArrowTool, handlePencilTool } from "../components/CanvasTools";
import type { Tool } from "../lib/tools";
import type { Pattern } from "../types";

type DragState =
	| {
			track: string;
			original: number;
			index?: number;
	  }
	| {
			type: "loop-start" | "loop-end";
			original: number;
	  }
	| null;

// Helper function to get track name from canvas coordinates
function getTrackFromPosition(
	y: number,
	rulerHeight: number,
	trackHeight: number,
	tracks: string[],
): string | null {
	const gridY = y - rulerHeight;
	const trackIndex = gridY >= 0 ? Math.floor(gridY / trackHeight) : -1;
	return trackIndex >= 0 && trackIndex < tracks.length
		? tracks[trackIndex]
		: null;
}

// Helper function to get step index from canvas x coordinate
function getStepIndexFromX(
	x: number,
	canvasWidth: number,
	steps: number,
): number {
	return Math.floor((x / canvasWidth) * steps);
}

export function useCanvasInteractions(
	canvasRef: React.RefObject<HTMLCanvasElement>,
	pattern: Pattern,
	tool: Tool,
	tracks: string[],
	steps: number,
	rulerHeight: number,
	trackHeight: number,
	onAddHit?: (track: string, position: number) => void,
	onRemoveHit?: (track: string, position: number) => void,
	onMoveHit?: (track: string, from: number, to: number) => void,
	onSetLoop?: (loop: { enabled: boolean; start: number; end: number }) => void,
) {
	const dragState = useRef<DragState>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handlePointerDown = (ev: PointerEvent) => {
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const y = ev.clientY - rect.top;
			// Use CSS pixel width (rect.width / canvas.clientWidth) instead of
			// the backing bitmap (canvas.width) which is scaled by devicePixelRatio.
			const cssWidth = rect.width || canvas.clientWidth || 0;
			const stepIndex = getStepIndexFromX(x, cssWidth, steps);
			const track = getTrackFromPosition(y, rulerHeight, trackHeight, tracks);

			// check for loop handle drag
			if (pattern.loop?.enabled && y >= -5 && y <= rulerHeight + 5) {
				const handle = getLoopHandleAtPosition(x, cssWidth, pattern);
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

		const handlePointerMove = (ev: PointerEvent) => {
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const cssWidth = rect.width || canvas.clientWidth || 0;
			// Update cursor if near playhead
			if (typeof currentPlayhead === "number") {
				const px =
					((currentPlayhead % (pattern.bars * 4)) / (pattern.bars * 4)) *
					cssWidth;
				const tolerance = 10; // slightly larger for handle
				if (Math.abs(x - px) <= tolerance) {
					canvas.style.cursor = "ew-resize";
				} else {
					canvas.style.cursor = "";
				}
			}
		};

		const handlePointerUp = (ev: PointerEvent) => {
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			if (!dragState.current || !canvas) return;
			const ds = dragState.current;
			dragState.current = null;
			canvas.releasePointerCapture(ev.pointerId);
			if ("type" in ds) {
				// loop drag
				const cssWidth = rect.width || canvas.clientWidth || 0;
				const clampedBar = computeBarFromX(x, cssWidth, pattern.bars);
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
				// hit drag - use CSS width for coordinate math to match visual layout
				const cssWidth = rect.width || canvas.clientWidth || 0;
				const stepIndex = Math.floor((x / cssWidth) * steps);
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
	}, [
		canvasRef,
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
	]);
}
