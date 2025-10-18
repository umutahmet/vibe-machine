import type { Pattern } from "../types";
import { getCanvasColors, HANDLE_HEIGHT, HANDLE_WIDTH } from "./canvasConfig";

// Draw grid area (assumes ctx origin is at the top-left of the grid area)
export function drawGridBody(
	ctx: CanvasRenderingContext2D,
	width: number,
	gridHeight: number,
	trackHeight: number,
	tracks: string[],
	pattern: Pattern,
	playhead: number,
	steps: number,
) {
	const COLORS = getCanvasColors();

	// highlight current beat
	const currentStep = Math.floor(playhead * 4) % steps;
	const stepWidth = width / steps;
	ctx.fillStyle = COLORS.beatHighlight;
	ctx.fillRect(currentStep * stepWidth, 0, stepWidth, gridHeight);

	// vertical grid lines
	ctx.strokeStyle = COLORS.gridLine;
	ctx.lineWidth = 0.5;
	for (let i = 0; i <= steps; i++) {
		const x = (i / steps) * width;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, gridHeight);
		ctx.stroke();
	}

	// horizontal separators
	ctx.strokeStyle = COLORS.separator;
	for (let i = 0; i <= tracks.length; i++) {
		const y = i * trackHeight;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
	}

	// draw loop region (under hits)
	if (pattern.loop?.enabled) {
		const loopStartBar = pattern.loop.start;
		const loopEndBar = pattern.loop.end;
		const totalBars = pattern.bars;
		const s = Math.max(0, Math.min(loopStartBar, totalBars - 1));
		const e = Math.max(s + 1, Math.min(loopEndBar, totalBars));
		const loopStartX = (s / totalBars) * width;
		const loopWidth = ((e - s) / totalBars) * width;

		ctx.save();
		ctx.fillStyle = COLORS.loopFill;
		ctx.fillRect(loopStartX, 0, loopWidth, gridHeight);
		ctx.strokeStyle = COLORS.loopStroke;
		ctx.lineWidth = 1;
		ctx.strokeRect(loopStartX + 0.5, 0.5, loopWidth - 1, gridHeight - 1);

		// handles
		ctx.fillStyle = COLORS.handleFill;
		ctx.fillRect(
			loopStartX - HANDLE_WIDTH / 2,
			-HANDLE_HEIGHT / 2,
			HANDLE_WIDTH,
			HANDLE_HEIGHT,
		);
		ctx.fillRect(
			loopStartX + loopWidth - HANDLE_WIDTH / 2,
			-HANDLE_HEIGHT / 2,
			HANDLE_WIDTH,
			HANDLE_HEIGHT,
		);
		ctx.restore();
	}
}

export default drawGridBody;
