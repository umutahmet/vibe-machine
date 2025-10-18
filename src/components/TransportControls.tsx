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
			<button
				type="button"
				onClick={onPlayToggle}
				className="transport-toggle"
				data-state={isPlaying ? "playing" : "stopped"}
			>
				<span className="toggle-icon" aria-hidden />
				<span className="toggle-label">{isPlaying ? "Stop" : "Play"}</span>
			</button>

			<label className="tempo-cluster">
				<span className="tempo-label">Tempo</span>
				<input
					className="tempo-slider"
					type="range"
					min={60}
					max={200}
					value={bpm}
					onChange={(e) => onBpmChange(Number(e.target.value))}
				/>
				<span className="tempo-value">{bpm} bpm</span>
			</label>
		</div>
	);
}
