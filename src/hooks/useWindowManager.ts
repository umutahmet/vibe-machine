import { useCallback, useRef, useState } from "react";
import type { WindowState, WindowType } from "../types";

export function useWindowManager() {
	const [windows, setWindows] = useState<WindowState[]>([]);
	const nextIdRef = useRef(1);
	const nextZIndexRef = useRef(1);

	const addWindow = useCallback(
		(
			type: WindowType,
			position: { x: number; y: number },
			size: { width: number; height: number },
		) => {
			const newWindow: WindowState = {
				id: `window-${nextIdRef.current++}`,
				type,
				position,
				size,
				zIndex: nextZIndexRef.current++,
			};
			setWindows((prev) => [...prev, newWindow]);
		},
		[],
	);

	const removeWindow = useCallback((id: string) => {
		setWindows((prev) => prev.filter((w) => w.id !== id));
	}, []);

	const updateWindowPosition = useCallback(
		(id: string, position: { x: number; y: number }) => {
			setWindows((prev) =>
				prev.map((w) => (w.id === id ? { ...w, position } : w)),
			);
		},
		[],
	);

	const bringToFront = useCallback((id: string) => {
		setWindows((prev) => {
			const window = prev.find((w) => w.id === id);
			if (!window) return prev;
			const newZIndex = nextZIndexRef.current++;
			return prev.map((w) => (w.id === id ? { ...w, zIndex: newZIndex } : w));
		});
	}, []);

	const getWindow = useCallback(
		(id: string) => {
			return windows.find((w) => w.id === id);
		},
		[windows],
	);

	return {
		windows,
		addWindow,
		removeWindow,
		updateWindowPosition,
		bringToFront,
		getWindow,
	};
}
