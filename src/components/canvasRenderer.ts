import type { Pattern } from "../types";
import { drawGridBody } from "./CanvasGridBody";
import { drawHits } from "./CanvasHits";
import { drawRuler } from "./CanvasRuler";
import { getCanvasColors } from "./canvasConfig";

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
}
