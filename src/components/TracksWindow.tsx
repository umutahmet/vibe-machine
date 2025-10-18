import { useAppContext } from "../context/appContextCore";

export default function TracksWindow() {
	const { pattern } = useAppContext();
	const trackNames = Object.keys(pattern.tracks);

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
}
