import type { WindowState } from "../types";
import { FloatingWindow } from "./FloatingWindow";

interface DesktopProps {
	windows: WindowState[];
	onPositionChange: (id: string, position: { x: number; y: number }) => void;
	onSizeChange?: (id: string, size: { width: number; height: number }) => void;
	onBringToFront: (id: string) => void;
	renderWindowContent: (window: WindowState) => React.ReactNode;
}

export default function Desktop({
	windows,
	onPositionChange,
	onSizeChange,
	onBringToFront,
	renderWindowContent,
}: DesktopProps) {
	return (
		<div className="desktop">
			{windows.map((window) => (
				<FloatingWindow
					key={window.id}
					window={window}
					onPositionChange={onPositionChange}
					onSizeChange={onSizeChange}
					onBringToFront={onBringToFront}
				>
					{renderWindowContent(window)}
				</FloatingWindow>
			))}
		</div>
	);
}
