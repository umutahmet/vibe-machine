import { useEffect, useRef } from "react";
import type { WindowState } from "../types";

interface UseWindowInitializationProps {
	addWindow: (
		type: string,
		position: { x: number; y: number },
		size: { width: number; height: number },
	) => void;
	loadWindows: (windows: WindowState[]) => void;
}

export function useWindowInitialization({
	addWindow,
	loadWindows,
}: UseWindowInitializationProps) {
	const initializedRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: 🤷‍♂️
	useEffect(() => {
		if (!initializedRef.current) {
			const saved = localStorage.getItem("vibe-machine-windows");
			if (saved) {
				try {
					const parsed: WindowState[] = JSON.parse(saved);
					if (parsed.length > 0) {
						loadWindows(parsed);
					} else {
						// Empty saved data, use defaults
						addWindow(
							"transport",
							{ x: 50, y: 50 },
							{ width: 400, height: 100 },
						);
						addWindow("grid", { x: 50, y: 200 }, { width: 800, height: 400 });
						addWindow("tools", { x: 50, y: 160 }, { width: 300, height: 80 });
						addWindow("chat", { x: 900, y: 50 }, { width: 300, height: 200 });
						addWindow(
							"tracks",
							{ x: 900, y: 300 },
							{ width: 300, height: 300 },
						);
					}
				} catch (error) {
					console.warn("Failed to load saved windows:", error);
					// Fallback to defaults
					addWindow("transport", { x: 50, y: 50 }, { width: 400, height: 100 });
					addWindow("grid", { x: 50, y: 200 }, { width: 800, height: 400 });
					addWindow("tools", { x: 50, y: 160 }, { width: 300, height: 80 });
					addWindow("chat", { x: 900, y: 50 }, { width: 300, height: 200 });
					addWindow("tracks", { x: 900, y: 300 }, { width: 300, height: 300 });
				}
			} else {
				// Initialize default windows
				addWindow("transport", { x: 50, y: 50 }, { width: 400, height: 100 });
				addWindow("grid", { x: 50, y: 200 }, { width: 800, height: 400 });
				addWindow("tools", { x: 50, y: 160 }, { width: 300, height: 80 });
				addWindow("chat", { x: 900, y: 50 }, { width: 300, height: 200 });
				addWindow("tracks", { x: 900, y: 300 }, { width: 300, height: 300 });
			}
			initializedRef.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
