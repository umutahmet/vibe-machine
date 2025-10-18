import type { Pattern } from "../types";

export function exportMidi(pattern: Pattern) {
	// placeholder: real implementation could use @tonejs/midi or similar
	const blob = new Blob([JSON.stringify(pattern, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "pattern.json";
	a.click();
	URL.revokeObjectURL(url);
}
