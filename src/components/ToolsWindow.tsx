import { clsx } from "clsx";
import { MousePointer2, Pencil } from "lucide-react";
import { useAppContext } from "../context/appContextCore";
import ToolName from "../lib/tools";

export default function ToolsWindow() {
	const { tool, setTool } = useAppContext();

	return (
		<div className="tools-row">
			<button
				type="button"
				onClick={() => setTool(ToolName.Arrow)}
				aria-pressed={tool === ToolName.Arrow}
				data-state={ToolName.Arrow}
				className={clsx("tool", { active: tool === ToolName.Arrow })}
			>
				<MousePointer2 />
			</button>
			<button
				type="button"
				onClick={() => setTool(ToolName.Pencil)}
				aria-pressed={tool === ToolName.Pencil}
				data-state={ToolName.Pencil}
				className={clsx("tool", { active: tool === ToolName.Pencil })}
			>
				<Pencil />
			</button>
		</div>
	);
}
