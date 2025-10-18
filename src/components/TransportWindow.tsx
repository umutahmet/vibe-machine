import TransportControls from "./TransportControls";

interface TransportWindowProps {
	bpm: number;
	isPlaying: boolean;
	onPlayToggle: () => void;
	onBpmChange: (bpm: number) => void;
	bars: number;
	loop?: { enabled: boolean; start: number; end: number };
	setLoop: (loop: { enabled: boolean; start: number; end: number }) => void;
}

export default function TransportWindow({
	bpm,
	isPlaying,
	onPlayToggle,
	onBpmChange,
	bars,
	loop,
	setLoop,
}: TransportWindowProps) {
	return (
		<TransportControls
			bpm={bpm}
			isPlaying={isPlaying}
			onPlayToggle={onPlayToggle}
			onBpmChange={onBpmChange}
			bars={bars}
			loop={loop}
			setLoop={setLoop}
		/>
	);
}
