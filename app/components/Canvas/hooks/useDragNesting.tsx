import { useState } from "react";
import { DraggingState } from "../types";

export function useDragNesting({
  dragging,
  onDragElement,
  canvasRef
}: {
  dragging: DraggingState | null;
  onDragElement?: (draggedId: string, targetId: string | null, position: "before" | "after" | "inside") => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [potentialParentId, setPotentialParentId] = useState<string | null>(null);

  // Check if dragged element is fully inside target element
  const isFullyInside = (draggedRect: DOMRect, targetRect: DOMRect): boolean => {
    return (
      draggedRect.left >= targetRect.left &&
      draggedRect.right <= targetRect.right &&
      draggedRect.top >= targetRect.top &&
      draggedRect.bottom <= targetRect.bottom
    );
  };

  // Handle mouse over to detect potential nesting
  const handleElementMouseOver = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();

    console.log("[useDragNesting] Mouse over:", targetId, "Dragging:", dragging?.id);

    // Only check nesting when dragging and not hovering over self
    if (!dragging || dragging.id === targetId) {
      console.log("[useDragNesting] Skipping - not dragging or hovering over self");
      return;
    }

    // Get rects
    const draggedEl = document.querySelector(`[data-element-id="${dragging.id}"]`);
    const targetEl = document.querySelector(`[data-element-id="${targetId}"]`);

    console.log("[useDragNesting] Elements:", { draggedEl, targetEl });

    if (!draggedEl || !targetEl) return;

    const draggedRect = draggedEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    console.log("[useDragNesting] Rects:", {
      dragged: { left: draggedRect.left, right: draggedRect.right, top: draggedRect.top, bottom: draggedRect.bottom },
      target: { left: targetRect.left, right: targetRect.right, top: targetRect.top, bottom: targetRect.bottom }
    });

    // Check if fully inside
    const fullyInside = isFullyInside(draggedRect, targetRect);
    console.log("[useDragNesting] Fully inside?", fullyInside);

    if (fullyInside) {
      console.log("[useDragNesting] Setting potential parent:", targetId);
      setPotentialParentId(targetId);
    } else {
      setPotentialParentId(null);
    }
  };

  // Handle mouse leave to clear potential parent
  const handleElementMouseLeave = (elementId: string) => {
    if (dragging && potentialParentId === elementId) {
      setPotentialParentId(null);
    }
  };

  // Handle drag end to commit nesting
  const handleDragEnd = () => {
    console.log("[useDragNesting] Drag end - dragging:", dragging?.id, "potentialParent:", potentialParentId);

    if (dragging && potentialParentId && onDragElement) {
      console.log("[useDragNesting] Calling onDragElement:", dragging.id, "→", potentialParentId);
      // Nest into parent
      onDragElement(dragging.id, potentialParentId, "inside");
    } else {
      console.log("[useDragNesting] Not nesting - conditions not met");
    }
    setPotentialParentId(null);
  };

  // Render highlight for potential parent during drag
  const renderPotentialParentOverlay = () => {
    if (!potentialParentId || !dragging || !canvasRef.current) return null;

    const el = document.querySelector(`[data-element-id="${potentialParentId}"]`);
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();

    return (
      <div
        className="absolute pointer-events-none border-2 border-primary rounded"
        style={{
          left: rect.left - canvasRect.left,
          top: rect.top - canvasRect.top,
          width: rect.width,
          height: rect.height,
        }}
      />
    );
  };

  return {
    potentialParentId,
    handleElementMouseOver,
    handleElementMouseLeave,
    handleDragEnd,
    renderPotentialParentOverlay
  };
}
