import type { Pattern } from "../types";
import { HANDLE_WIDTH } from "./canvasConfig";

// Returns 'start' | 'end' | null depending on whether x is within tolerance of a handle
export function getLoopHandleAtPosition(
	x: number,
	canvasWidth: number,
	pattern: Pattern,
	tolerance = 10,
): "loop-start" | "loop-end" | null {
	if (!pattern.loop?.enabled) return null;
	const totalBars = pattern.bars;
	const s = Math.max(0, Math.min(pattern.loop.start, totalBars - 1));
	const e = Math.max(s + 1, Math.min(pattern.loop.end, totalBars));
	const loopStartX = (s / totalBars) * canvasWidth;
	const loopEndX = (e / totalBars) * canvasWidth;
	if (Math.abs(x - loopStartX) <= tolerance + HANDLE_WIDTH / 2)
		return "loop-start";
	if (Math.abs(x - loopEndX) <= tolerance + HANDLE_WIDTH / 2) return "loop-end";
	return null;
}

export function computeBarFromX(x: number, canvasWidth: number, bars: number) {
	const raw = Math.floor((x / canvasWidth) * bars);
	return Math.max(0, Math.min(raw, bars));
}

export default { getLoopHandleAtPosition, computeBarFromX };
