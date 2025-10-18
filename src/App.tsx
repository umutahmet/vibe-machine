import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import "./App.css";
import CanvasGrid from "./components/CanvasGrid";
import ChatBox, { type ChatBoxHandle } from "./components/ChatBox";
import Desktop from "./components/Desktop";
import TransportControls from "./components/TransportControls";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { usePatternState } from "./hooks/usePatternState";
import { useToneEngine } from "./hooks/useToneEngine";
import { useTool } from "./hooks/useTool";
import { useWindowManager } from "./hooks/useWindowManager";
import { parseCommand } from "./lib/patternParser";
import shortcuts, { normalizeKey } from "./lib/shortcuts";
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
					addWindow("chat", { x: 900, y: 50 }, { width: 300, height: 200 });
					addWindow("tracks", { x: 900, y: 300 }, { width: 300, height: 300 });
				}
			} else {
				// Initialize default windows
				addWindow("transport", { x: 50, y: 50 }, { width: 400, height: 100 });
				addWindow("grid", { x: 50, y: 200 }, { width: 800, height: 400 });
				addWindow("chat", { x: 900, y: 50 }, { width: 300, height: 200 });
				addWindow("tracks", { x: 900, y: 300 }, { width: 300, height: 300 });
			}
			initializedRef.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useToneEngine(pattern, isPlaying);

	const chatRef = useRef<ChatBoxHandle | null>(null);

	const handleCommand = (cmd: string) => {
		const res = parseCommand(cmd, pattern);
		setPattern(res.pattern);
		// possible future: show res.message in a toast
	};

	// Keyboard shortcuts (global)
	useKeyboardShortcuts({
		// space toggles play/pause. note: e.key is ' ' for spacebar
		[normalizeKey(shortcuts.playPause)]: (e) => {
			e.preventDefault();
			// start audio context on play handled by TransportControls' onPlayToggle already
			setIsPlaying((s) => !s);
		},
		[shortcuts.prevBar]: (e) => {
			e.preventDefault();
			setPattern((p) => {
				const loop = p.loop ?? { enabled: false, start: 0, end: p.bars };
				if (!loop.enabled) return p;
				const start = Math.max(0, loop.start - 1);
				return { ...p, loop: { ...loop, start } };
			});
		},
		[shortcuts.nextBar]: (e) => {
			e.preventDefault();
			setPattern((p) => {
				const loop = p.loop ?? { enabled: false, start: 0, end: p.bars };
				if (!loop.enabled) return p;
				const start = Math.min(p.bars - 1, loop.start + 1);
				const end = Math.max(loop.end, start + 1);
				return { ...p, loop: { ...loop, start, end } };
			});
		},
		[shortcuts.toggleLoop]: (e) => {
			e.preventDefault();
			setPattern((p) => ({
				...p,
				loop: {
					enabled: !(p.loop?.enabled ?? false),
					start: p.loop?.start ?? 0,
					end: p.loop?.end ?? p.bars,
				},
			}));
		},
		// biome-ignore lint/complexity/useLiteralKeys: 🤷‍♂️
		["Enter"]: (e) => {
			// stop and rewind to beginning
			e.preventDefault();
			setIsPlaying(false);
			try {
				Tone.Transport.stop();
				// rewind to start using the position API
				// format: "bars:quarters:sixteenths"
				// set to 0 bars
				// @ts-expect-error: settable on runtime Transport
				Tone.Transport.position = "0:0:0";
			} catch (err) {
				console.error(err);
			}
		},
		[shortcuts.focusChat]: (e) => {
			e.preventDefault();
			chatRef.current?.focus();
		},
		// switch tools: 1=arrow, 2=pencil
		"1": (e) => {
			e.preventDefault();
			setTool(ToolName.Arrow);
		},
		"2": (e) => {
			e.preventDefault();
			setTool(ToolName.Pencil);
		},
	});

	const renderWindowContent = (window: WindowState) => {
		switch (window.type) {
			case "transport":
				return (
					<TransportControls
						bpm={pattern.bpm}
						isPlaying={isPlaying}
						onPlayToggle={async () => {
							if (!isPlaying) {
								// start audio context on play handled by TransportControls' onPlayToggle already
								try {
									await Tone.start();
								} catch {
									// ignore
								}
							}
							setIsPlaying((s) => !s);
						}}
						onBpmChange={(b) => setBPM(b)}
						bars={pattern.bars}
						loop={pattern.loop}
						setLoop={(l) => setLoop(l)}
					/>
				);
			case "grid":
				return (
					<div>
						<div
							style={{
								display: "flex",
								gap: 8,
								alignItems: "center",
								marginBottom: 8,
							}}
						>
							<button
								type="button"
								onClick={() => setTool(ToolName.Arrow)}
								data-state={ToolName.Arrow}
							>
								Arrow (1)
							</button>
							<button
								type="button"
								onClick={() => setTool(ToolName.Pencil)}
								data-state={ToolName.Pencil}
							>
								Pencil (2)
							</button>
						</div>
						<CanvasGrid
							pattern={pattern}
							tool={tool}
							onAddHit={(track, pos) => addHit(track, pos)}
							onRemoveHit={(track, pos) => removeHit(track, pos)}
							onMoveHit={(track, from, to) => {
								// naive implementation: remove old and add new (positions in quarter notes)
								removeHit(track, from);
								addHit(track, to);
							}}
							onSetLoop={setLoop}
						/>
					</div>
				);
			case "chat":
				return <ChatBox ref={chatRef} onCommand={handleCommand} />;
			case "tracks":
				return (
					<ul className="track-list">
						{trackNames.map((name, i) => (
							<li key={name} className="track-pill">
								<div className="track-header">
									<span className="track-title">Track {i + 1}</span>
									<span className="track-name">{name}</span>
								</div>
							</li>
						))}
					</ul>
				);
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
