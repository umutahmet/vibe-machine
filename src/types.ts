export type TrackMap = Record<string, number[]>;

export type Pattern = {
	bpm: number;
	bars: number;
	tracks: TrackMap;
};

export const DEFAULT_PATTERN: Pattern = {
	bpm: 170,
	bars: 4,
	tracks: {
		kick: [0, 2.5],
		snare: [1, 3],
		hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
	},
};
