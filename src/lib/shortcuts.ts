/** Simple helpers and a central place to list named shortcuts. */

export const keys = {
	playPause: " ", // Space
	prevBar: "ArrowLeft",
	nextBar: "ArrowRight",
	toggleLoop: "l",
	focusChat: "/",
} as const;

export function normalizeKey(
	key: string,
	opts?: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean },
) {
	const parts: string[] = [];
	if (opts?.ctrl) parts.push("ctrl");
	if (opts?.meta) parts.push("meta");
	if (opts?.alt) parts.push("alt");
	if (opts?.shift) parts.push("shift");
	const k = key.length === 1 ? key.toLowerCase() : key;
	parts.push(k);
	return parts.join("+");
}

export default keys;
