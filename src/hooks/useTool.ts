import { useState } from "react";
import type { Tool } from "../lib/tools";

export function useTool(initial: Tool) {
	const [tool, setTool] = useState<Tool>(initial);
	const set = (t: Tool) => setTool(t);
	return { tool, setTool: set } as const;
}

export default useTool;
