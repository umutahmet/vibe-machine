import type { Pattern } from "../types";
import { getCanvasColors, RULER_HEIGHT } from "./canvasConfig";

// Pure drawing helper for the top ruler. Keeps CanvasGrid smaller and focused.
export function drawRuler(
	ctx: CanvasRenderingContext2D,
	width: number,
	playheadBeats: number,
	pattern: Pattern,
) {
	const rulerHeight = RULER_HEIGHT;
	const COLORS = getCanvasColors();
	ctx.fillStyle = COLORS.rulerBg;
	ctx.fillRect(0, 0, width, rulerHeight);
	ctx.strokeStyle = COLORS.separator || `rgba(100, 100, 100, 0.5)`;
	ctx.lineWidth = 1;

	for (let bar = 0; bar <= pattern.bars; bar++) {
		const x = (bar / pattern.bars) * width;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, rulerHeight);
		ctx.stroke();
		if (bar < pattern.bars) {
			ctx.fillStyle = COLORS.rulerText;
			ctx.font = "12px monospace";
			ctx.fillText(`${bar + 1}`, x + 2, 15);
		}
	}

	const currentBar = Math.floor(playheadBeats / 4) % pattern.bars;
	const barX = (currentBar / pattern.bars) * width;
	const barWidth = (1 / pattern.bars) * width;
	ctx.fillStyle = COLORS.barHighlight;
	ctx.fillRect(barX, 0, barWidth, rulerHeight);
}

export default drawRuler;
