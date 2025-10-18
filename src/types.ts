export type TrackMap = Record<string, number[]>;

export type Pattern = {
	bpm: number;
	bars: number;
	tracks: TrackMap;
	loop?: {
		enabled: boolean;
		start: number; // start bar (0-based, in measures)
		end: number; // end bar (in measures, exclusive when used as X m)
	};
};

export const DEFAULT_PATTERN: Pattern = {
	bpm: 170,
	bars: 4,
	tracks: {
		kick: [0, 2.5],
		snare: [1, 3],
		hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
	},
	loop: {
		enabled: false,
		start: 0,
		end: 4,
	},
};
