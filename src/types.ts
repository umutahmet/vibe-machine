export type TrackMap = Record<string, number[]>;

export type Pattern = {
	bpm: number;
	bars: number;
	tracks: TrackMap;
};

export const DEFAULT_PATTERN: Pattern = {
	bpm: 120,
	bars: 2,
	tracks: {
		kick: [0, 1, 2, 3],
		snare: [1.5, 3.5],
		hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
	},
};
