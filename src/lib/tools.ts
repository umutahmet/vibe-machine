export const ToolName = {
	Arrow: "arrow",
	Pencil: "pencil",
} as const;

export type Tool = (typeof ToolName)[keyof typeof ToolName];

export const DEFAULT_TOOL: Tool = ToolName.Arrow;

export default ToolName;
