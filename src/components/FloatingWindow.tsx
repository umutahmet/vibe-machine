import { useDrag } from "../hooks/useDrag";
import type { WindowState } from "../types";

interface FloatingWindowProps {
	window: WindowState;
	onPositionChange: (id: string, position: { x: number; y: number }) => void;
	onBringToFront: (id: string) => void;
	children: React.ReactNode;
}

export function FloatingWindow({
	window,
	onPositionChange,
	onBringToFront,
	children,
}: FloatingWindowProps) {
	const handleDrag = (deltaX: number, deltaY: number) => {
		const newX = window.position.x + deltaX;
		const newY = window.position.y + deltaY;
		onPositionChange(window.id, { x: newX, y: newY });
	};

	const { handleMouseDown } = useDrag(handleDrag);

	const handleWindowClick = () => {
		onBringToFront(window.id);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 🤷‍♂️
		<div
			className="floating-window"
			style={{
				left: window.position.x,
				top: window.position.y,
				width: window.size.width,
				height: window.size.height,
				zIndex: window.zIndex,
			}}
			onClick={handleWindowClick}
			onKeyDown={() => {}}
		>
			{/** biome-ignore lint/a11y/noStaticElementInteractions: 🤷‍♂️ */}
			<div className="window-title-bar" onMouseDown={handleMouseDown}>
				<span className="window-title">{window.type}</span>
				<button
					type="button"
					className="window-close"
					onClick={(e) => {
						e.stopPropagation(); /* TODO: close */
					}}
				>
					×
				</button>
			</div>
			<div className="window-content">{children}</div>
		</div>
	);
}
