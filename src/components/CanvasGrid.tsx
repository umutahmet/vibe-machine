import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import type { Pattern } from "../types";

type Props = { pattern: Pattern };

export default function CanvasGrid({ pattern }: Props) {
	const ref = useRef<HTMLCanvasElement | null>(null);
	const [playhead, setPlayhead] = useState(0);

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
		canvas.width = canvas.clientWidth || 800;
		const width = canvas.width;
		canvas.height = 200;
		const height = 200;
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
				const x = (h / (pattern.bars * 4)) * width; // position in quarter beats
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

	return <canvas ref={ref} className="vibe-canvas" />;
}
