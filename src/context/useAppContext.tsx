import { useContext } from "react";
import type { ChatBoxHandle } from "../components/ChatBox";
import type ToolName from "../lib/tools";
import type { Pattern, WindowState } from "../types";
import { AppContext } from "./AppContext";

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

export function useAppContext() {
	const ctx = useContext(
		AppContext as unknown as React.Context<AppContextValue | null>,
	);
	if (!ctx) throw new Error("useAppContext must be used within AppProvider");
	return ctx as AppContextValue;
}

export default useAppContext;
