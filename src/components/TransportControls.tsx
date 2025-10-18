type Props = {
	bpm: number;
	isPlaying: boolean;
	onPlayToggle: () => void;
	onBpmChange: (b: number) => void;
	bars: number;
	loop?: { enabled: boolean; start: number; end: number } | undefined;
	setLoop?: (loop: { enabled: boolean; start: number; end: number }) => void;
};

export default function TransportControls({
	bpm,
	isPlaying,
	onPlayToggle,
	onBpmChange,
	bars,
	loop,
	setLoop,
}: Props) {
	const toggleLoop = () => {
		if (!setLoop) return;
		setLoop({
			enabled: !(loop?.enabled ?? false),
			start: loop?.start ?? 0,
			end: loop?.end ?? bars,
		});
	};

	const updateLoopStart = (v: number) => {
		if (!setLoop) return;
		const end = loop?.end ?? bars;
		const start = Math.max(0, Math.min(v, end - 1));
		setLoop({ enabled: true, start, end });
	};

	const updateLoopEnd = (v: number) => {
		if (!setLoop) return;
		const start = loop?.start ?? 0;
		const end = Math.max(1, Math.min(v, bars));
		const safeStart = Math.min(start, end - 1);
		setLoop({ enabled: true, start: safeStart, end });
	};

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

			{/* loop controls */}
			<label style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<input
					type="checkbox"
					checked={!!loop?.enabled}
					onChange={toggleLoop}
				/>{" "}
				Loop
			</label>
			{loop?.enabled ? (
				<label style={{ display: "flex", gap: 8, alignItems: "center" }}>
					Start:
					<input
						type="number"
						min={0}
						max={bars - 1}
						value={loop?.start ?? 0}
						onChange={(e) => updateLoopStart(Number(e.target.value))}
						style={{ width: 60 }}
					/>
					End:
					<input
						type="number"
						min={1}
						max={bars}
						value={loop?.end ?? bars}
						onChange={(e) => updateLoopEnd(Number(e.target.value))}
						style={{ width: 60 }}
					/>
				</label>
			) : null}
		</div>
	);
}
