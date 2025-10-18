import { useEffect, useRef } from "react";

type Handler = (e: KeyboardEvent) => void;

/**
 * Simple, reusable hook to register keyboard shortcuts.
 * Accepts a map of normalized key -> handler. Handlers can call e.preventDefault()
 * to stop the default browser action. The hook is intentionally minimal and
 * doesn't try to do focus-scoping (keep it global). It cleans up on unmount.
 */
export function useKeyboardShortcuts(map: Record<string, Handler | null>) {
	const mapRef = useRef(map);
	mapRef.current = map;

	useEffect(() => {
		const listener = (e: KeyboardEvent) => {
			// build a normalized key string: use lower-case for letters and include
			// modifiers in a stable order.
			const parts: string[] = [];
			if (e.ctrlKey) parts.push("ctrl");
			if (e.metaKey) parts.push("meta");
			if (e.altKey) parts.push("alt");
			if (e.shiftKey) parts.push("shift");

			const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
			parts.push(key);
			const normalized = parts.join("+");

			const handler = mapRef.current[normalized] ?? mapRef.current[key];
			if (handler) {
				try {
					handler(e);
				} catch (err) {
					// swallow handler errors so keyboard system doesn't break the app
					console.error("keyboard handler error", err);
				}
			}
		};

		window.addEventListener("keydown", listener);
		return () => window.removeEventListener("keydown", listener);
	}, []);
}

export default useKeyboardShortcuts;
