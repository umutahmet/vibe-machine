import { useEffect, useState } from "react";
import type { Pattern } from "../types";
import { DEFAULT_PATTERN } from "../types";

const STORAGE_KEY = "vibe:pattern";

export function usePatternState() {
	const [pattern, setPattern] = useState<Pattern>(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : DEFAULT_PATTERN;
		} catch {
			return DEFAULT_PATTERN;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(pattern));
		} catch {
			// ignore
		}
	}, [pattern]);

	const addTrack = (name: string) => {
		setPattern((p) => ({ ...p, tracks: { ...p.tracks, [name]: [] } }));
	};

	const removeTrack = (name: string) => {
		setPattern((p) => {
			const copy = { ...p.tracks };
			delete copy[name];
			return { ...p, tracks: copy };
		});
	};

	const addHit = (track: string, position: number) => {
		setPattern((p) => {
			const existing = p.tracks[track] || [];
			return {
				...p,
				tracks: {
					...p.tracks,
					[track]: [...existing, position].sort((a, b) => a - b),
				},
			};
		});
	};

	const removeHit = (track: string, position: number) => {
		setPattern((p) => ({
			...p,
			tracks: {
				...p.tracks,
				[track]: (p.tracks[track] || []).filter((x) => x !== position),
			},
		}));
	};

	const setBPM = (bpm: number) => setPattern((p) => ({ ...p, bpm }));

	const setLoop = (loop: { enabled: boolean; start: number; end: number }) =>
		setPattern((p) => ({ ...p, loop }));

	return {
		pattern,
		setPattern,
		addTrack,
		removeTrack,
		addHit,
		removeHit,
		setBPM,
		setLoop,
	};
}
