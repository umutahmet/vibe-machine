type Props = {
	bpm: number;
	isPlaying: boolean;
	onPlayToggle: () => void;
	onBpmChange: (b: number) => void;
};

export default function TransportControls({
	bpm,
	isPlaying,
	onPlayToggle,
	onBpmChange,
}: Props) {
	return (
		<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
			<button onClick={onPlayToggle}>{isPlaying ? "Stop" : "Play"}</button>
			<label>
				BPM:{" "}
				<input
					type="range"
					min={60}
					max={200}
					value={bpm}
					onChange={(e) => onBpmChange(Number(e.target.value))}
				/>{" "}
				{bpm}
			</label>
		</div>
	);
}
