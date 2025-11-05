import { useRef, useState } from "react";
import { FEElement, ResizingState } from "./types";
import { useHoverAndSelectionOverlay } from "./hooks/useHoverAndSelectionOverlay";
import { useResizing } from "./hooks/useResizing";
import { renderElement } from "./utils/renderElement";

export function Canvas({
  elements,
  selectedElementId,
  hoverElementId,
  onSelectElement,
  onHoverElement,
  onMoveElement,
  onResizeElement,
  isDragging = false,
}: {
  elements: FEElement[];
  selectedElementId: string | null;
  hoverElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onHoverElement: (id: string | null) => void;
  onMoveElement: (id: string, pos: {x: number, y: number}) => void;
  onResizeElement: (
    id: string,
    size: { width: number; height: number },
    position?: { x: number; y: number }
  ) => void;
  isDragging?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [resizing, setResizing] = useState<ResizingState | null>(null);

  const {handleResizeStart} = useResizing({
    resizing,
    setResizing,
    onResizeElement
  })

  const { renderSelectionOverlay, renderHoverOverlay } = useHoverAndSelectionOverlay({
    canvasRef,
    elements,
    selectedElementId,
    hoverElementId,
    handleResizeStart
  })

  return (
    <div
      className="w-full h-full relative"
      ref={canvasRef}
      onClick={() => onSelectElement(null)}
      onMouseOver={() => onHoverElement(null)}
    >
      {elements.map((el) =>
        renderElement(el, {
          isRoot: true,
          onSelectElement,
          onHoverElement,
        })
      )}

      {/* Selection overlay - hide while dragging */}
      {!isDragging && renderSelectionOverlay()}
      {!isDragging && renderHoverOverlay()}
    </div>
  );
}
