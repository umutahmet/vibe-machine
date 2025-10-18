import { useCallback, useEffect, useRef, useState } from "react";
import type { WindowState, WindowType } from "../types";

export function useWindowManager() {
	const [windows, setWindows] = useState<WindowState[]>([]);
	const nextIdRef = useRef(1);
	const nextZIndexRef = useRef(1);

	// Save windows to localStorage whenever they change
	useEffect(() => {
		if (windows.length > 0) {
			localStorage.setItem("vibe-machine-windows", JSON.stringify(windows));
		}
	}, [windows]);

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

	const loadWindows = useCallback((initialWindows: WindowState[]) => {
		setWindows(initialWindows);
		// Update refs to avoid conflicts
		nextIdRef.current =
			Math.max(...initialWindows.map((w) => parseInt(w.id.split("-")[1])), 0) +
			1;
		nextZIndexRef.current =
			Math.max(...initialWindows.map((w) => w.zIndex), 0) + 1;
	}, []);

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

	const updateWindowSize = useCallback(
		(id: string, size: { width: number; height: number }) => {
			setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
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
		loadWindows,
		removeWindow,
		updateWindowPosition,
		bringToFront,
		updateWindowSize,
		getWindow,
	};
}
