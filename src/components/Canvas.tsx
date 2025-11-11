import { useRef, useState } from "react";
import { FEElement, ResizingState } from "./types";
import { useHoverAndSelectionOverlay } from "./hooks/useHoverAndSelectionOverlay";
import { useResizing } from "./hooks/useResizing";
import { usePotentialParentOverlay } from "./hooks/usePotentialParentOverlay";
import { renderElement } from "./utils/renderElement";

export function Canvas({
  elements,
  selectedElementId,
  hoverElementId,
  onSelectElement,
  onHoverElement,
  onResizeElement,
  isDragging = false,
  potentialParentId = null,
  components = {},
}: {
  elements: FEElement[];
  selectedElementId: string | null;
  hoverElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onHoverElement: (id: string | null) => void;
  onResizeElement: (
    id: string,
    size: { width: number; height: number },
    position?: { x: number; y: number }
  ) => void;
  isDragging?: boolean;
  potentialParentId?: string | null;
  components?: Record<string, React.ComponentType<any>>;
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

  const { renderPotentialParentOverlay } = usePotentialParentOverlay({
    canvasRef,
    potentialParentId,
  })

  return (
    <div
      className="w-full h-full relative"
      ref={canvasRef}
      onClick={() => onSelectElement(null)}
      onMouseOver={() => onHoverElement(null)}
    >
      {elements.filter(el => el.type !== 'text').map((el) =>
        <div
          key={el.id}
          className="absolute"
          style={{
            top: el.canvasPosition?.y || 20,
            left: el.canvasPosition?.x || 20,
          }}
        >
        {renderElement(el, {
          onSelectElement,
          onHoverElement,
          components,
        })}
        </div>
      )}

      {/* Selection overlay - hide while dragging */}
      {!isDragging && renderSelectionOverlay()}
      {!isDragging && renderHoverOverlay()}

      {/* Potential parent overlay - show while dragging */}
      {isDragging && renderPotentialParentOverlay()}
    </div>
  );
}
