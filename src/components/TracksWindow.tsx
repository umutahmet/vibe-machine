import { useAppContext } from "../context/appContextCore";

export default function TracksWindow() {
	const { pattern } = useAppContext();
	const trackNames = Object.keys(pattern.tracks);

	return (
		<ul className="grid-lane-list">
			{trackNames.map((name, i) => (
				<li key={name} className="grid-lane-pill">
					<div className="grid-lane-header">
						<span className="grid-lane-title">Track {i + 1}</span>
						<span className="grid-lane-name">{name}</span>
					</div>
				</li>
			))}
		</ul>
	);
}
