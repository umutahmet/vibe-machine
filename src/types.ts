export type Block = {
	// start measured in bars (0-based)
	start: number;
	// block length in bars
	bars: number;
	// hit positions relative to block start, measured in quarter-note beats (e.g. 0, 0.5, 1.5)
	hits: number[];
};

export type Track = {
	blocks: Block[];
};

export type TrackMap = Record<string, Track>;

export type Pattern = {
	bpm: number;
	bars: number;
	tracks: TrackMap;
	loop?: {
		enabled: boolean;
		start: number; // start bar (0-based)
		end: number; // end bar (in measures)
	};
};

export const DEFAULT_PATTERN: Pattern = {
	bpm: 170,
	bars: 4,
	tracks: {
		kick: { blocks: [{ start: 0, bars: 4, hits: [0, 2.5] }] },
		snare: { blocks: [{ start: 0, bars: 4, hits: [1, 3] }] },
		hat: {
			blocks: [{ start: 0, bars: 4, hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] }],
		},
	},
	loop: {
		enabled: false,
		start: 0,
		end: 4,
	},
};
