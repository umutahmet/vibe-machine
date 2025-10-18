import type { Pattern } from "../types";

// Helper to find a hit near a step index
function findHitNearStep(
	pattern: Pattern,
	track: string,
	stepIndex: number,
): { pos: number } | null {
	const tr = pattern.tracks[track];
	if (!tr) return null;
	let found: { pos: number } | null = null;
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
			Object.values(b.hits as Record<string, number[]>).forEach((arr) => {
				(arr || []).forEach((rel) => {
					const abs = blockStartQ + rel;
					const absStep = Math.floor(abs * 4);
					if (Math.abs(absStep - stepIndex) <= 1) {
						found = { pos: abs };
					}
				});
			});
		}
	});
	return found;
}

// Handle pencil tool: toggle hit
export function handlePencilTool(
	pattern: Pattern,
	track: string,
	stepIndex: number,
	onAddHit?: (track: string, position: number) => void,
	onRemoveHit?: (track: string, position: number) => void,
) {
	const quarterPos = Math.floor(stepIndex / 4) + (stepIndex % 4) / 4;
	const found = findHitNearStep(pattern, track, stepIndex);
	if (found) {
		onRemoveHit?.(track, found.pos);
	} else {
		onAddHit?.(track, quarterPos);
	}
}

// Handle arrow tool: start drag on hit
export function handleArrowTool(
	pattern: Pattern,
	track: string,
	stepIndex: number,
	dragState: React.MutableRefObject<
		| { track: string; original: number; index?: number }
		| { type: "loop-start" | "loop-end"; original: number }
		| null
	>,
	canvas: HTMLCanvasElement,
	ev: PointerEvent,
) {
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

export default { handlePencilTool, handleArrowTool };
