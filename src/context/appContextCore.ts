import { createContext, useContext } from "react";
import type { ChatBoxHandle } from "../components/ChatBox";
import type ToolName from "../lib/tools";
import type { Pattern, WindowState } from "../types";

export type AppContextValue = {
	pattern: Pattern;
	setPattern: (p: Pattern) => void;
	undo: () => void;
	redo: () => void;
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
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error("useAppContext must be used within AppProvider");
	return ctx;
}

export default AppContext;
