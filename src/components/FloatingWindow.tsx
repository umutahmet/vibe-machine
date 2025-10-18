import { useDrag } from "../hooks/useDrag";
import type { WindowState } from "../types";

interface FloatingWindowProps {
	window: WindowState;
	onPositionChange: (id: string, position: { x: number; y: number }) => void;
	onSizeChange?: (id: string, size: { width: number; height: number }) => void;
	onBringToFront: (id: string) => void;
	children: React.ReactNode;
}

export function FloatingWindow({
	window,
	onPositionChange,
	onSizeChange,
	onBringToFront,
	children,
}: FloatingWindowProps) {
	const handleDrag = (deltaX: number, deltaY: number) => {
		const newX = window.position.x + deltaX;
		const newY = window.position.y + deltaY;
		onPositionChange(window.id, { x: newX, y: newY });
	};

	const { handleMouseDown } = useDrag(handleDrag);

	// Resize handling using useDrag as well
	const handleResize = (deltaX: number, deltaY: number) => {
		if (!onSizeChange) return;
		const newWidth = Math.max(120, (window.size?.width || 300) + deltaX);
		const newHeight = Math.max(80, (window.size?.height || 200) + deltaY);
		onSizeChange(window.id, { width: newWidth, height: newHeight });
	};

	const { handleMouseDown: handleResizeMouseDown } = useDrag(handleResize);

	const handleWindowClick = () => {
		onBringToFront(window.id);
	};

	const style: React.CSSProperties = {
		left: window.position.x,
		top: window.position.y,
		zIndex: window.zIndex,
	};

	if (typeof window.size?.width === "number") style.width = window.size.width;
	if (typeof window.size?.height === "number")
		style.height = window.size.height;

	const className = `floating-window${typeof window.size?.height === "number" ? " fixed-size" : ""}`;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 🤷‍♂️
		<div
			className={className}
			style={style}
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
			{/* resize handle - bottom right (button for accessibility) */}
			<button
				aria-label="Resize window"
				type="button"
				className="window-resize-handle"
				onMouseDown={(e) => {
					e.stopPropagation();
					handleResizeMouseDown(e);
				}}
			/>
		</div>
	);
}
