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
		<div className="transport-row">
			<button type="button" onClick={onPlayToggle}>
				{isPlaying ? "Stop" : "Play"}
			</button>
			<label className="bpm-label">
				BPM:
				<input
					className="bpm-range"
					type="range"
					min={60}
					max={200}
					value={bpm}
					onChange={(e) => onBpmChange(Number(e.target.value))}
				/>
				<span className="bpm-value">{bpm}</span>
			</label>
		</div>
	);
}
