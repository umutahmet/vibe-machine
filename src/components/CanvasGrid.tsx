import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import type { Pattern } from "../types";

type Tool = "arrow" | "pencil";

type GridProps = {
	pattern: Pattern;
	tool?: Tool;
	onAddHit?: (track: string, position: number) => void;
	onRemoveHit?: (track: string, position: number) => void;
	onMoveHit?: (track: string, from: number, to: number) => void;
};

export default function CanvasGrid({
	pattern,
	tool = "arrow",
	onAddHit,
	onRemoveHit,
	onMoveHit,
}: GridProps) {
	const ref = useRef<HTMLCanvasElement | null>(null);
	const [playhead, setPlayhead] = useState(0);

	// interaction state
	const dragState = useRef<{
		track: string;
		original: number;
		index?: number;
	} | null>(null);

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
		const height = 100;
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

		// draw block outlines (subtle) so pattern blocks are visible per track
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
				const y = (yi / tracks.length) * height;
				const bh = trackHeight - 6;

				ctx.save();
				ctx.fillStyle = "rgba(47, 226, 255, 0.04)"; // very subtle fill
				ctx.fillRect(blockStartX + 1, y + 3, Math.max(2, blockW - 2), bh);
				ctx.strokeStyle = "rgba(47, 226, 255, 0.08)";
				ctx.lineWidth = 1;
				ctx.strokeRect(
					blockStartX + 1.5,
					y + 3.5,
					Math.max(1, blockW - 3),
					bh - 1,
				);
				ctx.restore();
			});
		});

		// draw hits from blocks (support both legacy array and new instrument->positions map)
		tracks.forEach((t, yi) => {
			const track = pattern.tracks[t];
			if (!track || !Array.isArray(track.blocks)) return;
			track.blocks.forEach((b) => {
				const blockStartQ = b.start * 4; // quarter-note beats at block start
				const y = (yi / tracks.length) * height;
				const rectHeight = trackHeight - 4;
				const rectWidth = Math.min(stepWidth - 4, 16); // slightly smaller

				// new format: hits is an object mapping instrument->positions
				if (b.hits && typeof b.hits === "object" && !Array.isArray(b.hits)) {
					Object.values(b.hits as Record<string, number[]>).forEach((arr) => {
						(arr || []).forEach((rel) => {
							const abs = blockStartQ + rel; // absolute quarter-note beat position
							const stepIndex = Math.floor(abs * 4); // convert to sixteenth index
							const x = (stepIndex / steps) * width;
							ctx.fillStyle = "rgba(47, 226, 255, 0.9)";
							ctx.shadowColor = "rgba(31, 186, 255, 0.45)";
							ctx.shadowBlur = 12;
							ctx.fillRect(x + 2, y + 2, rectWidth, rectHeight);
						});
					});
				} else if (Array.isArray(b.hits)) {
					(b.hits as number[]).forEach((rel) => {
						const abs = blockStartQ + rel; // absolute quarter-note beat position
						const stepIndex = Math.floor(abs * 4); // convert to sixteenth index
						const x = (stepIndex / steps) * width;
						ctx.fillStyle = "rgba(47, 226, 255, 0.9)";
						ctx.shadowColor = "rgba(31, 186, 255, 0.45)";
						ctx.shadowBlur = 12;
						ctx.fillRect(x + 2, y + 2, rectWidth, rectHeight);
					});
				}
			});
		});

		// playhead (optional, since we have highlight)
		// ctx.fillStyle = "#ff0000";
		// const px = ((playhead % (pattern.bars * 4)) / (pattern.bars * 4)) * width;
		// ctx.fillRect(px, 0, 2, height);
	}, [pattern, playhead]);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const steps = pattern.bars * 16;
		const handlePointerDown = (ev: PointerEvent) => {
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const y = ev.clientY - rect.top;
			const stepIndex = Math.floor((x / canvas.width) * steps);
			const trackIndex = Math.floor(
				(y / canvas.height) * Object.keys(pattern.tracks).length,
			);
			const track =
				Object.keys(pattern.tracks)[trackIndex] ??
				Object.keys(pattern.tracks)[0];
			if (tool === "pencil") {
				// toggle hit at this step (in quarter-note beats)
				const quarterPos = Math.floor(stepIndex / 4) + (stepIndex % 4) / 4;
				// detect existing hit near the step
				let found: { pos: number } | null = null;
				const tr = pattern.tracks[track];
				if (tr) {
					tr.blocks.forEach((b) => {
						const blockStartQ = b.start * 4;
						if (Array.isArray(b.hits)) {
							(b.hits as number[]).forEach((rel) => {
								const abs = blockStartQ + rel;
								const absStep = Math.floor(abs * 4);
								if (Math.abs(absStep - stepIndex) <= 1) {
									found = { pos: abs };
								}
							});
						} else if (b.hits && typeof b.hits === "object") {
							Object.values(b.hits as Record<string, number[]>).forEach(
								(arr) => {
									(arr || []).forEach((rel) => {
										const abs = blockStartQ + rel;
										const absStep = Math.floor(abs * 4);
										if (Math.abs(absStep - stepIndex) <= 1) {
											found = { pos: abs };
										}
									});
								},
							);
						}
					});
				}
				if (found) {
					onRemoveHit?.(track, found.pos);
				} else {
					onAddHit?.(track, quarterPos);
				}
			} else if (tool === "arrow") {
				// try to find a hit near this step and start drag
				const tr = pattern.tracks[track];
				if (!tr) return;
				let found: { idx: number; pos: number } | null = null;
				tr.blocks.forEach((b) => {
					const blockStartQ = b.start * 4;
					if (Array.isArray(b.hits)) {
						(b.hits as number[]).forEach((rel) => {
							const abs = blockStartQ + rel;
							const absStep = Math.floor(abs * 4);
							if (Math.abs(absStep - stepIndex) <= 1) {
								found = { idx: absStep, pos: abs };
							}
						});
					} else if (b.hits && typeof b.hits === "object") {
						Object.values(b.hits as Record<string, number[]>).forEach((arr) => {
							(arr || []).forEach((rel) => {
								const abs = blockStartQ + rel;
								const absStep = Math.floor(abs * 4);
								if (Math.abs(absStep - stepIndex) <= 1) {
									found = { idx: absStep, pos: abs };
								}
							});
						});
					}
				});
				if (found) {
					dragState.current = { track, original: found.pos, index: found.idx };
					canvas.setPointerCapture(ev.pointerId);
				}
			}
		};

		const handlePointerMove = () => {
			// no-op for now; kept for future visual feedback
		};

		const handlePointerUp = (ev: PointerEvent) => {
			if (!dragState.current || !canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const stepIndex = Math.floor((x / canvas.width) * steps);
			const toQuarter = Math.floor(stepIndex / 4) + (stepIndex % 4) / 4;
			const ds = dragState.current;
			dragState.current = null;
			canvas.releasePointerCapture(ev.pointerId);
			onMoveHit?.(ds.track, ds.original, toQuarter);
		};

		canvas.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		return () => {
			canvas.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [pattern, tool, onAddHit, onRemoveHit, onMoveHit]);

	return <canvas ref={ref} className="vibe-canvas" />;
}
