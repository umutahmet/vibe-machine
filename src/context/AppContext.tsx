import React, { createContext, useRef } from "react";
import type { ChatBoxHandle } from "../components/ChatBox";
import { useAppShortcuts } from "../hooks/useAppShortcuts";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import { usePatternState } from "../hooks/usePatternState";
import { useToneEngine } from "../hooks/useToneEngine";
import { useTool } from "../hooks/useTool";
import { useWindowInitialization } from "../hooks/useWindowInitialization";
import { useWindowManager } from "../hooks/useWindowManager";
import { parseCommand } from "../lib/patternParser";
import type ToolName from "../lib/tools";
import ToolEnum from "../lib/tools";
import type { Pattern, WindowState } from "../types";

type AppContextValue = {
	pattern: Pattern;
	setPattern: (p: Pattern) => void;
	setBPM: (bpm: number) => void;
	setLoop: (loop: { enabled: boolean; start: number; end: number }) => void;
	addHit: (track: string, pos: number) => void;
	removeHit: (track: string, pos: number) => void;
	tool: ToolName;
	setTool: (t: ToolName) => void;
	isPlaying: boolean;
	setIsPlaying: (s: boolean | ((s: boolean) => boolean)) => void;
	windows: WindowState[];
	addWindow: (w: WindowState) => void;
	loadWindows: (w: WindowState[]) => void;
	updateWindowPosition: (id: string, pos: { x: number; y: number }) => void;
	bringToFront: (id: string) => void;
	chatRef: React.RefObject<ChatBoxHandle | null>;
	handleCommand: (cmd: string) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
	const ctx = React.useContext(AppContext);
	if (!ctx) throw new Error("useAppContext must be used within AppProvider");
	return ctx;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { pattern, setBPM, setPattern, setLoop, addHit, removeHit } =
		usePatternState();
	const { tool, setTool } = useTool(ToolEnum.Arrow);
	const [isPlaying, setIsPlaying] = React.useState(false);

	const {
		windows,
		addWindow,
		loadWindows,
		updateWindowPosition,
		bringToFront,
	} = useWindowManager();

	useWindowInitialization({ addWindow, loadWindows });

	useToneEngine(pattern, isPlaying);

	const chatRef = useRef<ChatBoxHandle | null>(null);

	const handleCommand = (cmd: string) => {
		const res = parseCommand(cmd, pattern);
		setPattern(res.pattern);
	};

	const shortcutsMap = useAppShortcuts({
		setIsPlaying,
		setPattern,
		setTool,
		focusChat: () => chatRef.current?.focus(),
	});

	useKeyboardShortcuts(shortcutsMap);

	const value: AppContextValue = {
		pattern,
		setPattern,
		setBPM,
		setLoop,
		addHit,
		removeHit,
		tool,
		setTool,
		isPlaying,
		setIsPlaying,
		windows,
		addWindow,
		loadWindows,
		updateWindowPosition,
		bringToFront,
		chatRef,
		handleCommand,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export default AppProvider;
