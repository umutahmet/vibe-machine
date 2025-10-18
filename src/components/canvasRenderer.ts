import type { Pattern } from "../types";
import { drawGridBody } from "./CanvasGridBody";
import { drawHits } from "./CanvasHits";
import { drawRuler } from "./CanvasRuler";

/**
 * Render the full canvas scene: ruler, grid body, hits, and playhead.
 *
 * Parameters are intentionally primitive to keep this function reusable and
 * easy to test independently of React.
 */
export function renderCanvas(
	canvas: HTMLCanvasElement,
	pattern: Pattern,
	playhead: number,
	tracks: string[],
	steps: number,
	gridHeight: number,
	rulerHeight: number,
	trackHeight: number,
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	// Use devicePixelRatio for crisp rendering on HiDPI displays but avoid
	// repeatedly changing the canvas DOM width/height which can cause
	// layout reflows when called many times per second. Only update the
	// backing bitmap size when it differs from the desired size.
	const dpr = window.devicePixelRatio || 1;
	const clientWidth = canvas.clientWidth || 800;
	const desiredWidth = Math.max(1, Math.floor(clientWidth * dpr));
	const desiredHeight = Math.max(
		1,
		Math.floor((rulerHeight + gridHeight) * dpr),
	);

	if (canvas.width !== desiredWidth || canvas.height !== desiredHeight) {
		// Set the backing bitmap size
		canvas.width = desiredWidth;
		canvas.height = desiredHeight;
		// Keep the CSS layout height stable
		canvas.style.height = `${rulerHeight + gridHeight}px`;
	}

	// Map drawing coordinates to CSS pixels
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	const width = canvas.width / dpr;
	ctx.clearRect(0, 0, width, rulerHeight + gridHeight);

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

	// Note: Playhead is now drawn as an overlay element for better event separation
}
