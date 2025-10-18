import { useAppContext } from "../context/appContextCore";
import TransportControls from "./TransportControls";

export default function TransportWindow() {
	const { pattern, isPlaying, setIsPlaying, setBPM, setLoop } = useAppContext();

	return (
		<TransportControls
			bpm={pattern.bpm}
			isPlaying={isPlaying}
			onPlayToggle={() => setIsPlaying((s) => !s)}
			onBpmChange={setBPM}
			bars={pattern.bars}
			loop={pattern.loop}
			setLoop={setLoop}
		/>
	);
}
