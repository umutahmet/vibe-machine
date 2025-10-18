import React, { useRef } from "react";
import type { ChatBoxHandle } from "../components/ChatBox";
import { useAppShortcuts } from "../hooks/useAppShortcuts";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import { usePatternState } from "../hooks/usePatternState";
import { useToneEngine } from "../hooks/useToneEngine";
import { useTool } from "../hooks/useTool";
import { useWindowInitialization } from "../hooks/useWindowInitialization";
import { useWindowManager } from "../hooks/useWindowManager";
import { parseCommand } from "../lib/patternParser";
import ToolEnum from "../lib/tools";
import { AppContext, type AppContextValue } from "./appContextCore";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const {
		pattern,
		setBPM,
		setPattern,
		setLoop,
		addHit,
		removeHit,
		undo,
		redo,
	} = usePatternState();
	const { tool, setTool } = useTool(ToolEnum.Arrow);
	const [isPlaying, setIsPlaying] = React.useState(false);

	const {
		windows,
		addWindow,
		loadWindows,
		updateWindowPosition,
		bringToFront,
		updateWindowSize,
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
		undo,
		redo,
	});

	useKeyboardShortcuts(shortcutsMap);

	const value: AppContextValue = {
		pattern,
		setPattern,
		undo,
		redo,
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
		updateWindowSize,
		bringToFront,
		chatRef,
		handleCommand,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export default AppProvider;
