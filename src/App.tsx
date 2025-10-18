import { useRef, useState } from "react";
import * as Tone from "tone";
import "./App.css";
import type { ChatBoxHandle } from "./components/ChatBox";
import ChatWindow from "./components/ChatWindow";
import Desktop from "./components/Desktop";
import GridWindow from "./components/GridWindow";
import TracksWindow from "./components/TracksWindow";
import TransportWindow from "./components/TransportWindow";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { usePatternState } from "./hooks/usePatternState";
import { useToneEngine } from "./hooks/useToneEngine";
import { useTool } from "./hooks/useTool";
import { useWindowInitialization } from "./hooks/useWindowInitialization";
import { useWindowManager } from "./hooks/useWindowManager";
import { parseCommand } from "./lib/patternParser";

import ToolName from "./lib/tools";
import type { WindowState } from "./types";

function App() {
	const { pattern, setBPM, setPattern, setLoop, addHit, removeHit } =
		usePatternState();
	const { tool, setTool } = useTool(ToolName.Arrow);
	const [isPlaying, setIsPlaying] = useState(false);
	const trackNames = Object.keys(pattern.tracks);

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
		// possible future: show res.message in a toast
	};

	const handlePlayToggle = async () => {
		if (!isPlaying) {
			try {
				await Tone.start();
			} catch {
				// ignore
			}
		}
		setIsPlaying((s) => !s);
	};

	const shortcutsMap = useAppShortcuts({
		setIsPlaying,
		setPattern,
		setTool,
		focusChat: () => chatRef.current?.focus(),
	});

	// Keyboard shortcuts (global)
	useKeyboardShortcuts(shortcutsMap);

	const renderWindowContent = (window: WindowState) => {
		switch (window.type) {
			case "transport":
				return (
					<TransportWindow
						bpm={pattern.bpm}
						isPlaying={isPlaying}
						onPlayToggle={handlePlayToggle}
						onBpmChange={setBPM}
						bars={pattern.bars}
						loop={pattern.loop}
						setLoop={setLoop}
					/>
				);
			case "grid":
				return (
					<GridWindow
						pattern={pattern}
						tool={tool}
						setTool={setTool}
						addHit={addHit}
						removeHit={removeHit}
						setLoop={setLoop}
					/>
				);
			case "chat":
				return <ChatWindow ref={chatRef} onCommand={handleCommand} />;
			case "tracks":
				return <TracksWindow trackNames={trackNames} />;
			default:
				return <div>Unknown window type</div>;
		}
	};

	return (
		<Desktop
			windows={windows}
			onPositionChange={updateWindowPosition}
			onBringToFront={bringToFront}
			renderWindowContent={renderWindowContent}
		/>
	);
}

export default App;
