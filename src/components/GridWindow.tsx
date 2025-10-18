import { useAppContext } from "../context/appContextCore";
import CanvasGrid from "./CanvasGrid";

export default function GridWindow() {
	const { pattern, tool, addHit, removeHit, setLoop } = useAppContext();

	return (
		<CanvasGrid
			pattern={pattern}
			tool={tool}
			onAddHit={addHit}
			onRemoveHit={removeHit}
			onMoveHit={(track, from, to) => {
				removeHit(track, from);
				addHit(track, to);
			}}
			onSetLoop={setLoop}
		/>
	);
}
