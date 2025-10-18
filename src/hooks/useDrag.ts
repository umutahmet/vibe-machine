import { useCallback, useEffect, useState } from "react";

export function useDrag(onDrag: (deltaX: number, deltaY: number) => void) {
	const [isDragging, setIsDragging] = useState(false);
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;
			const deltaX = e.clientX - startPos.x;
			const deltaY = e.clientY - startPos.y;
			onDrag(deltaX, deltaY);
			setStartPos({ x: e.clientX, y: e.clientY });
		},
		[isDragging, onDrag, startPos.x, startPos.y],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp]);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		setIsDragging(true);
		setStartPos({ x: e.clientX, y: e.clientY });
		e.preventDefault();
	}, []);

	return {
		handleMouseDown,
	};
}
