import { Dispatch, SetStateAction, useEffect } from "react";
import { DraggingState, FEElement } from "../types";

export function useDragging({
  dragging,
  setDragging,
  onMoveElement
}: {
  dragging: DraggingState | null;
  setDragging: Dispatch<SetStateAction<DraggingState | null>>;
  onMoveElement: (id: string, pos: {x: number, y: number}) => void;
}) {

  const handleDragStart = (e: React.MouseEvent, element: FEElement) => {
    e.stopPropagation();
    setDragging({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: (element.canvasPosition?.x as number) || 0,
      startTop: (element.canvasPosition?.y as number) || 0,
    });
  };


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
        const deltaX = e.clientX - dragging.startX;
        const deltaY = e.clientY - dragging.startY;

        onMoveElement(dragging.id, {
          x: dragging.startLeft + deltaX,
          y: dragging.startTop + deltaY,
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, setDragging, onMoveElement]);


  return {
    handleDragStart
  }

}
