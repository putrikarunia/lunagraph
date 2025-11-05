import   { createElement, Fragment,   useRef, useState } from "react";
import { DraggingState, FEElement, ResizingState } from "./types";
import { useDragging } from "./hooks/useDragging";
import { useHoverAndSelectionOverlay } from "./hooks/useHoverAndSelectionOverlay";
import { useResizing } from "./hooks/useResizing";

export function Canvas({
  elements,
  selectedElementId,
  hoverElementId,
  onSelectElement,
  onHoverElement,
  onMoveElement,
  onResizeElement
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
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState<DraggingState | null>(null);
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

  const {handleDragStart} = useDragging({
    dragging,
    setDragging,
    onMoveElement
  })

  const renderElement = (element: FEElement): React.ReactNode => {
    const commonProps = {
      "data-element-id": element.id,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectElement(element.id);
      },
      onMouseOver: (e: React.MouseEvent) => {
        e.stopPropagation();
        onHoverElement(element.id);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        e.stopPropagation();
        onHoverElement(null);
      },
      onMouseDown: (e: React.MouseEvent) => handleDragStart(e, element),
      // onDoubleClick: (e: React.MouseEvent) => handleDoubleClick(e, element),
      // onDrop: (e: React.DragEvent) => handleDrop(e, element.id),
      // onDragOver: handleDragOver,
    };

    let content = <div>Default Content</div>;

    if (element.type === "html") {
      content = createElement(
        element.tag ?? 'div',
        {
          style: element.styles,
          ...commonProps,
        },
        element.children?.map(renderElement)
      );
    }

    return <Fragment key={element.id}>{content}</Fragment>;
  };
  return (
    <div
      className="w-full h-full relative"
      ref={canvasRef}
      onClick={() => onSelectElement(null)}
      onMouseOver={() => onHoverElement(null)}
    >
      {elements.map((el) => (
        // Root elements have specific canvas position
        <div
          key={el.id}
          className="absolute" style={{
          top: el.canvasPosition?.y || 20,
          left: el.canvasPosition?.x || 20,
        }}>
          {renderElement(el)}
        </div>
      ))}

      {/* Selection overlay */}
      {renderSelectionOverlay()}
      {renderHoverOverlay()}
    </div>
  );
}
