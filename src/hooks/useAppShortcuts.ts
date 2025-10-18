import * as Tone from "tone";
import shortcuts, { normalizeKey } from "../lib/shortcuts";
import ToolName from "../lib/tools";
import type { Pattern } from "../types";

interface UseAppShortcutsProps {
	setIsPlaying: (fn: (prev: boolean) => boolean) => void;
	setPattern: (fn: (prev: Pattern) => Pattern) => void;
	setTool: (tool: ToolName) => void;
	focusChat: () => void;
}

export function useAppShortcuts({
	setIsPlaying,
	setPattern,
	setTool,
	focusChat,
}: UseAppShortcutsProps) {
	return {
		[normalizeKey(shortcuts.playPause)]: (e: KeyboardEvent) => {
			e.preventDefault();
			setIsPlaying((s) => !s);
		},
		[shortcuts.prevBar]: (e: KeyboardEvent) => {
			e.preventDefault();
			setPattern((p) => {
				const loop = p.loop ?? { enabled: false, start: 0, end: p.bars };
				if (!loop.enabled) return p;
				const start = Math.max(0, loop.start - 1);
				return { ...p, loop: { ...loop, start } };
			});
		},
		[shortcuts.nextBar]: (e: KeyboardEvent) => {
			e.preventDefault();
			setPattern((p) => {
				const loop = p.loop ?? { enabled: false, start: 0, end: p.bars };
				if (!loop.enabled) return p;
				const start = Math.min(p.bars - 1, loop.start + 1);
				const end = Math.max(loop.end, start + 1);
				return { ...p, loop: { ...loop, start, end } };
			});
		},
		[shortcuts.toggleLoop]: (e: KeyboardEvent) => {
			e.preventDefault();
			setPattern((p) => ({
				...p,
				loop: {
					enabled: !(p.loop?.enabled ?? false),
					start: p.loop?.start ?? 0,
					end: p.loop?.end ?? p.bars,
				},
			}));
		},
		// biome-ignore lint/complexity/useLiteralKeys: 🤷‍♂️
		["Enter"]: (e: KeyboardEvent) => {
			// stop and rewind to beginning
			e.preventDefault();
			setIsPlaying(false);
			try {
				Tone.Transport.stop();
				// rewind to start using the position API
				// format: "bars:quarters:sixteenths"
				// set to 0 bars
				// @ts-expect-error: settable on runtime Transport
				Tone.Transport.position = "0:0:0";
			} catch (err) {
				console.error(err);
			}
		},
		[shortcuts.focusChat]: (e: KeyboardEvent) => {
			e.preventDefault();
			focusChat();
		},
		// switch tools: 1=arrow, 2=pencil
		"1": (e: KeyboardEvent) => {
			e.preventDefault();
			setTool(ToolName.Arrow);
		},
		"2": (e: KeyboardEvent) => {
			e.preventDefault();
			setTool(ToolName.Pencil);
		},
	};
}
