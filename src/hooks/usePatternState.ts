import type { SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import type { Block, Pattern, Track } from "../types";
import { DEFAULT_PATTERN } from "../types";

const STORAGE_KEY = "vibe:pattern";

export function usePatternState() {
	const [pattern, setPattern] = useState<Pattern>(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return DEFAULT_PATTERN;
			const parsed = JSON.parse(raw) as unknown;
			// migrate legacy tracks (array of positions) into blocks
			const pObj = parsed as Record<string, unknown>;
			if (pObj?.tracks) {
				const migrated: Record<string, Track> = {};
				Object.entries(pObj.tracks).forEach(([name, value]) => {
					if (Array.isArray(value)) {
						migrated[name] = {
							blocks: [
								{
									start: 0,
									bars: pObj.bars ?? DEFAULT_PATTERN.bars,
									hits: value,
								},
							],
						};
					} else if (value && typeof value === "object") {
						const v = value as Record<string, unknown>;
						if (Array.isArray(v.blocks)) {
							migrated[name] = v as Track;
						} else {
							migrated[name] = { blocks: [] };
						}
					} else {
						migrated[name] = { blocks: [] };
					}
				});
				pObj.tracks = migrated;
			}
			return pObj as Pattern;
		} catch {
			return DEFAULT_PATTERN;
		}
	});

	// keep pattern persisted
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(pattern));
		} catch {
			// ignore
		}
	}, [pattern]);

	// Simple snapshot history (full-pattern snapshots). We keep it in refs
	// to avoid triggering rerenders on every history push. Expose undo/redo
	// functions that update the pattern state.
	const historyCap = 100;
	const pastRef = useRef<Pattern[]>([]);
	const futureRef = useRef<Pattern[]>([]);

	// Helper to push a snapshot when pattern is about to change
	const pushSnapshot = (snapshot: Pattern) => {
		pastRef.current.push(snapshot);
		if (pastRef.current.length > historyCap) {
			pastRef.current.shift();
		}
		// new action invalidates future
		futureRef.current = [];
	};

	// Wrap setPattern so callers can provide either a value or updater
	const setPatternWithHistory = (updater: SetStateAction<Pattern>) => {
		setPattern((prev) => {
			// push previous state
			pushSnapshot(prev);
			const next =
				typeof updater === "function"
					? (updater as (p: Pattern) => Pattern)(prev)
					: updater;
			return next as Pattern;
		});
	};

	const undo = () => {
		setPattern((prev) => {
			const past = pastRef.current;
			if (past.length === 0) return prev;
			const last = past.pop() as Pattern;
			futureRef.current.push(prev);
			return last;
		});
	};

	const redo = () => {
		setPattern((prev) => {
			const future = futureRef.current;
			if (future.length === 0) return prev;
			const next = future.pop() as Pattern;
			pastRef.current.push(prev);
			return next;
		});
	};

	const addTrack = (name: string) => {
		setPatternWithHistory((p) => ({
			...p,
			tracks: { ...p.tracks, [name]: { blocks: [] } },
		}));
	};

	const removeTrack = (name: string) => {
		setPatternWithHistory((p) => {
			const copy = { ...p.tracks };
			delete copy[name];
			return { ...p, tracks: copy };
		});
	};

	// position is absolute quarter-note beats across the pattern (same as previous API)
	const addHit = (track: string, position: number) => {
		setPatternWithHistory((p) => {
			const tr = p.tracks[track] || { blocks: [] };
			// find a block that contains this position
			const blockIndex = tr.blocks.findIndex((b) => {
				const startQ = b.start * 4;
				const endQ = (b.start + b.bars) * 4;
				return position >= startQ && position < endQ;
			});
			if (blockIndex >= 0) {
				const b = tr.blocks[blockIndex];
				const rel = position - b.start * 4;
				const hits = Array.from(new Set([...b.hits, rel])).sort(
					(a, z) => a - z,
				);
				const newBlocks = tr.blocks.slice();
				newBlocks[blockIndex] = { ...b, hits };
				return {
					...p,
					tracks: { ...p.tracks, [track]: { blocks: newBlocks } },
				};
			}
			// no block matched: create a default full-length block and add the hit
			const newBlock: Block = { start: 0, bars: p.bars, hits: [position] };
			return { ...p, tracks: { ...p.tracks, [track]: { blocks: [newBlock] } } };
		});
	};

	const removeHit = (track: string, position: number) => {
		setPatternWithHistory((p) => {
			const tr = p.tracks[track];
			if (!tr) return p;
			let changed = false;
			const newBlocks = tr.blocks.map((b) => {
				const startQ = b.start * 4;
				const rel = position - startQ;
				if (rel < 0 || rel >= b.bars * 4) return b;
				const filtered = b.hits.filter((h) => h !== rel);
				if (filtered.length !== b.hits.length) changed = true;
				return { ...b, hits: filtered };
			});
			if (!changed) return p;
			return { ...p, tracks: { ...p.tracks, [track]: { blocks: newBlocks } } };
		});
	};

	const setBPM = (bpm: number) => setPatternWithHistory((p) => ({ ...p, bpm }));

	const setLoop = (loop: { enabled: boolean; start: number; end: number }) =>
		setPatternWithHistory((p) => ({ ...p, loop }));

	return {
		pattern,
		// keep original name for compatibility but provide history-aware setter
		setPattern: setPatternWithHistory as unknown as (p: Pattern) => void,
		addTrack,
		removeTrack,
		addHit,
		removeHit,
		setBPM,
		setLoop,
		undo,
		redo,
	};
}
