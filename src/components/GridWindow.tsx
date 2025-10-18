import type ToolName from "../lib/tools";
import type { Pattern } from "../types";
import CanvasGrid from "./CanvasGrid";

interface GridWindowProps {
	pattern: Pattern;
	tool: ToolName;
	setTool: (tool: ToolName) => void;
	addHit: (track: string, pos: number) => void;
	removeHit: (track: string, pos: number) => void;
	setLoop: (loop: { enabled: boolean; start: number; end: number }) => void;
}

export default function GridWindow({
	pattern,
	tool,
	addHit,
	removeHit,
	setLoop,
}: GridWindowProps) {
	return (
		<CanvasGrid
			pattern={pattern}
			tool={tool}
			onAddHit={addHit}
			onRemoveHit={removeHit}
			onMoveHit={(track, from, to) => {
				// naive implementation: remove old and add new (positions in quarter notes)
				removeHit(track, from);
				addHit(track, to);
			}}
			onSetLoop={setLoop}
		/>
	);
}
