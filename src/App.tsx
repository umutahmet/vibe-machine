import { useState } from "react";
import "./App.css";
import CanvasGrid from "./components/CanvasGrid";
import ChatBox from "./components/ChatBox";
import TransportControls from "./components/TransportControls";
import { usePatternState } from "./hooks/usePatternState";
import { useToneEngine } from "./hooks/useToneEngine";
import { parseCommand } from "./lib/patternParser";

function App() {
	const { pattern, setBPM, setPattern } = usePatternState();
	const [isPlaying, setIsPlaying] = useState(false);

	useToneEngine(pattern, isPlaying);

	const handleCommand = (cmd: string) => {
		const res = parseCommand(cmd, pattern);
		setPattern(res.pattern);
		// possible future: show res.message in a toast
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>Vibe Machine</h1>
			<TransportControls
				bpm={pattern.bpm}
				isPlaying={isPlaying}
				onPlayToggle={() => setIsPlaying((s) => !s)}
				onBpmChange={(b) => setBPM(b)}
			/>

			<div style={{ marginTop: 12 }}>
				<CanvasGrid pattern={pattern} playhead={0} />
			</div>

			<div style={{ marginTop: 12 }}>
				<ChatBox onCommand={handleCommand} />
			</div>
		</div>
	);
}

export default App;
