import { useAppContext } from "../context/AppContext";
import ToolName from "../lib/tools";

export default function ToolsWindow() {
	const { tool, setTool } = useAppContext();

	return (
		<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
			<button
				type="button"
				onClick={() => setTool(ToolName.Arrow)}
				aria-pressed={tool === ToolName.Arrow}
				data-state={ToolName.Arrow}
			>
				Arrow (1)
			</button>
			<button
				type="button"
				onClick={() => setTool(ToolName.Pencil)}
				aria-pressed={tool === ToolName.Pencil}
				data-state={ToolName.Pencil}
			>
				Pencil (2)
			</button>
		</div>
	);
}
