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
		canvas.height = 300;
		const height = 300;
		ctx.clearRect(0, 0, width, height);

		const tracks = Object.keys(pattern.tracks);
		const steps = pattern.bars * 16;

		// highlight current beat
		const currentStep = Math.floor(playhead * 4) % steps;
		const stepWidth = width / steps;
		ctx.fillStyle = "rgba(58, 132, 255, 0.12)";
		ctx.fillRect(currentStep * stepWidth, 0, stepWidth, height);

		// draw grid
		ctx.strokeStyle = "rgba(92, 124, 180, 0.28)";
		ctx.lineWidth = 0.5;
		for (let i = 0; i <= steps; i++) {
			const x = (i / steps) * width;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}

		// draw track separators
		const trackHeight = height / tracks.length;
		ctx.strokeStyle = "rgba(45, 64, 104, 0.5)";
		for (let i = 0; i <= tracks.length; i++) {
			const y = (i / tracks.length) * height;
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
			// clamp
			const s = Math.max(0, Math.min(loopStartBar, totalBars - 1));
			const e = Math.max(s + 1, Math.min(loopEndBar, totalBars));
			const loopStartX = (s / totalBars) * width;
			const loopWidth = ((e - s) / totalBars) * width;

			ctx.save();
			ctx.fillStyle = "rgba(58, 132, 255, 0.06)"; // subtle blue tint
			ctx.fillRect(loopStartX, 0, loopWidth, height);
			ctx.strokeStyle = "rgba(58, 132, 255, 0.12)";
			ctx.lineWidth = 1;
			ctx.strokeRect(loopStartX + 0.5, 0.5, loopWidth - 1, height - 1);
			ctx.restore();
		}

		// draw hits from blocks
		tracks.forEach((t, yi) => {
			const track = pattern.tracks[t];
			if (!track || !Array.isArray(track.blocks)) return;
			track.blocks.forEach((b) => {
				const blockStartQ = b.start * 4; // quarter-note beats at block start
				b.hits.forEach((rel) => {
					const abs = blockStartQ + rel; // absolute quarter-note beat position
					const stepIndex = Math.floor(abs * 4); // convert to sixteenth index
					const x = (stepIndex / steps) * width;
					const y = (yi / tracks.length) * height;
					const rectHeight = trackHeight - 4;
					const rectWidth = Math.min(stepWidth - 4, 16); // slightly smaller
					ctx.fillStyle = "rgba(47, 226, 255, 0.9)";
					ctx.shadowColor = "rgba(31, 186, 255, 0.45)";
					ctx.shadowBlur = 12;
					ctx.fillRect(x + 2, y + 2, rectWidth, rectHeight);
				});
			});
		});

		// playhead (optional, since we have highlight)
		// ctx.fillStyle = "#ff0000";
		// const px = ((playhead % (pattern.bars * 4)) / (pattern.bars * 4)) * width;
		// ctx.fillRect(px, 0, 2, height);
	}, [pattern, playhead]);

	return <canvas ref={ref} className="vibe-canvas" />;
}
