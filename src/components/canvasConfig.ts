// Shared visual constants for canvas-based components
export const RULER_HEIGHT = 30;
export const TRACK_HEIGHT = 25;
export const HANDLE_WIDTH = 4;
export const HANDLE_HEIGHT = 10;

// Canvas color tokens (CSS variable names). Canvas code should call getCanvasColors()
// at runtime to resolve these into actual rgba()/hex strings so the canvas matches CSS theme.
export const CANVAS_COLOR_VARS = {
	rulerBg: "--canvas-ruler-bg", // fallback will be computed
	rulerText: "--canvas-ruler-text",
	barHighlight: "--canvas-bar-highlight",
	beatHighlight: "--canvas-beat-highlight",
	gridLine: "--canvas-grid-line",
	separator: "--canvas-separator",
	loopFill: "--canvas-loop-fill",
	loopStroke: "--canvas-loop-stroke",
	handleFill: "--canvas-handle-fill",
	hitFill: "--canvas-hit-fill",
	hitShadow: "--canvas-hit-shadow",
};

function getComputedVar(name: string, fallback = "") {
	if (typeof window === "undefined" || !window.getComputedStyle)
		return fallback;
	const val = getComputedStyle(document.documentElement).getPropertyValue(name);
	return val ? val.trim() : fallback;
}

export function getCanvasColors() {
	// Provide runtime-resolved colors falling back to sensible defaults
	return {
		rulerBg: getComputedVar("--canvas-ruler-bg", "rgba(30,30,30,0.9)"),
		rulerText: getComputedVar("--canvas-ruler-text", "rgba(200,200,200,0.8)"),
		barHighlight: getComputedVar(
			"--canvas-bar-highlight",
			"rgba(217,169,52,0.18)",
		),
		beatHighlight: getComputedVar(
			"--canvas-beat-highlight",
			"rgba(217,169,52,0.12)",
		),
		gridLine: getComputedVar("--canvas-grid-line", "rgba(60,50,40,0.18)"),
		separator: getComputedVar("--canvas-separator", "rgba(45,40,36,0.45)"),
		loopFill: getComputedVar("--canvas-loop-fill", "rgba(217,169,52,0.06)"),
		loopStroke: getComputedVar("--canvas-loop-stroke", "rgba(217,169,52,0.12)"),
		handleFill: getComputedVar("--canvas-handle-fill", "rgba(217,169,52,0.9)"),
		hitFill: getComputedVar("--canvas-hit-fill", "rgba(217,169,52,0.9)"),
		hitShadow: getComputedVar("--canvas-hit-shadow", "rgba(255,200,87,0.25)"),
	};
}

export default {
	RULER_HEIGHT,
	TRACK_HEIGHT,
	HANDLE_WIDTH,
	HANDLE_HEIGHT,
	CANVAS_COLOR_VARS,
	getCanvasColors,
};
