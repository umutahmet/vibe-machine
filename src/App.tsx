import { useState } from "react";
import * as Tone from "tone";
import "./App.css";
import CanvasGrid from "./components/CanvasGrid";
import ChatBox from "./components/ChatBox";
import TransportControls from "./components/TransportControls";
import { usePatternState } from "./hooks/usePatternState";
import { useToneEngine } from "./hooks/useToneEngine";
import { parseCommand } from "./lib/patternParser";

function App() {
	const { pattern, setBPM, setPattern, setLoop } = usePatternState();
	const [isPlaying, setIsPlaying] = useState(false);
	const trackNames = Object.keys(pattern.tracks);
	const totalSteps = pattern.bars * 16;

	useToneEngine(pattern, isPlaying);

	const handleCommand = (cmd: string) => {
		const res = parseCommand(cmd, pattern);
		setPattern(res.pattern);
		// possible future: show res.message in a toast
	};

	return (
		<div className="app-shell">
			<header className="top-bar">
				<div className="brand-cluster">
					<span className="brand-mark" aria-hidden />
					<div className="brand-meta">
						<span className="brand-title">Vibe Machine</span>
						<span className="brand-caption">Session Console</span>
					</div>
				</div>

				<div className="transport-dock">
					<TransportControls
						bpm={pattern.bpm}
						isPlaying={isPlaying}
						onPlayToggle={async () => {
							if (!isPlaying) {
								// start audio context in response to user gesture
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
				</div>

				<div className="session-readout">
					<span>{trackNames.length} tracks</span>
					<span>{totalSteps} steps</span>
				</div>
			</header>

			<main className="workspace">
				<aside className="side-rail">
					<span className="rail-label">Tracks</span>
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
				</aside>

				<section className="grid-panel">
					<div className="panel-header">
						<div className="panel-title">
							<span className="panel-label">Pattern Grid</span>
							<span className="panel-caption">
								Bars {pattern.bars} • BPM {pattern.bpm}
							</span>
						</div>
						<div className="panel-divider" aria-hidden />
					</div>

					<div className="canvas-wrap">
						<CanvasGrid pattern={pattern} />
					</div>
				</section>
			</main>

			<footer className="command-dock">
				<div className="command-header">
					<span className="command-led" aria-hidden />
					<span className="command-title">Command Line Interface</span>
				</div>
				<div className="command-form">
					<ChatBox onCommand={handleCommand} />
				</div>
			</footer>
		</div>
	);
}

export default App;
