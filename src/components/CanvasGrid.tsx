import { useEffect, useRef } from "react";
import type { Pattern } from "../types";

type Props = { pattern: Pattern; playhead?: number };

export default function CanvasGrid({ pattern, playhead = 0 }: Props) {
	const ref = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d")!;
		const width = (canvas.width = 800);
		const height = (canvas.height = 200);
		ctx.clearRect(0, 0, width, height);

		const tracks = Object.keys(pattern.tracks);
		const steps = pattern.bars * 16;

		// draw grid
		ctx.strokeStyle = "#444";
		for (let i = 0; i <= steps; i++) {
			const x = (i / steps) * width;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}

		// draw hits
		tracks.forEach((t, yi) => {
			const hits = pattern.tracks[t];
			hits.forEach((h) => {
				const x = (h / pattern.bars / 4) * width; // simple mapping
				const y = (yi / tracks.length) * height;
				ctx.fillStyle = "#0cf";
				ctx.fillRect(x, y, 8, height / tracks.length - 4);
			});
		});

		// playhead
		ctx.fillStyle = "rgba(255,0,0,0.6)";
		const px = ((playhead % (pattern.bars * 4)) / (pattern.bars * 4)) * width;
		ctx.fillRect(px, 0, 2, height);
	}, [pattern, playhead]);

	return <canvas ref={ref} style={{ width: "100%", height: 200 }} />;
}
