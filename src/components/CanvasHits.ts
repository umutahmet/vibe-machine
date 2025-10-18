import type { Pattern } from "../types";
import { getCanvasColors } from "./canvasConfig";

// Draw hits and blocks. Assumes ctx origin is at the top-left of the grid area
export function drawHits(
	ctx: CanvasRenderingContext2D,
	width: number,
	steps: number,
	tracks: string[],
	trackHeight: number,
	pattern: Pattern,
) {
	const COLORS = getCanvasColors();
	const stepWidth = width / steps;

	// draw block outlines and hits
	tracks.forEach((t, yi) => {
		const track = pattern.tracks[t];
		if (!track || !Array.isArray(track.blocks)) return;
		track.blocks.forEach((b) => {
			const totalBars = pattern.bars;
			const startBar = Math.max(0, Math.min(b.start, totalBars));
			const endBar = Math.max(
				startBar + 0.001,
				Math.min(b.start + (b.bars || 1), totalBars),
			);
			const blockStartX = (startBar / totalBars) * width;
			const blockW = ((endBar - startBar) / totalBars) * width;
			const y = yi * trackHeight;
			const bh = trackHeight - 6;

			ctx.save();
			ctx.fillStyle = COLORS.loopFill || `rgba(var(--accent-gold-rgb), 0.04)`; // very subtle fill
			ctx.fillRect(blockStartX + 1, y + 3, Math.max(2, blockW - 2), bh);
			ctx.strokeStyle =
				COLORS.loopStroke || `rgba(var(--accent-gold-rgb), 0.08)`;
			ctx.lineWidth = 1;
			ctx.strokeRect(
				blockStartX + 1.5,
				y + 3.5,
				Math.max(1, blockW - 3),
				bh - 1,
			);
			ctx.restore();

			// hits
			const blockStartQ = b.start * 4; // quarter-note beats at block start
			const rectHeight = trackHeight - 4;
			const rectWidth = Math.min(stepWidth - 4, 16);

			if (b.hits && typeof b.hits === "object" && !Array.isArray(b.hits)) {
				Object.values(b.hits as Record<string, number[]>).forEach((arr) => {
					(arr || []).forEach((rel) => {
						const abs = blockStartQ + rel; // absolute quarter-note beat position
						const stepIndex = Math.floor(abs * 4); // convert to sixteenth index
						const x = (stepIndex / steps) * width;
						ctx.fillStyle = COLORS.hitFill;
						ctx.shadowColor = COLORS.hitShadow;
						ctx.shadowBlur = 12;
						ctx.fillRect(x + 2, y + 2, rectWidth, rectHeight);
					});
				});
			} else if (Array.isArray(b.hits)) {
				(b.hits as number[]).forEach((rel) => {
					const abs = blockStartQ + rel; // absolute quarter-note beat position
					const stepIndex = Math.floor(abs * 4); // convert to sixteenth index
					const x = (stepIndex / steps) * width;
					ctx.fillStyle = COLORS.hitFill;
					ctx.shadowColor = COLORS.hitShadow;
					ctx.shadowBlur = 12;
					ctx.fillRect(x + 2, y + 2, rectWidth, rectHeight);
				});
			}
		});
	});
}

export default drawHits;
