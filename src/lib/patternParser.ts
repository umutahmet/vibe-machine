import type { Pattern } from "../types";

export function parseCommand(
	input: string,
	pattern: Pattern,
): { message: string; pattern: Pattern } {
	const tokens = input.toLowerCase().split(/\s+/);
	if (tokens[0] === "add" && tokens[1]) {
		const name = tokens[1];
		const p = { ...pattern, tracks: { ...pattern.tracks, [name]: [] } };
		return { message: `Added track ${name}`, pattern: p };
	}
	return { message: `Unknown command: ${input}`, pattern };
}
