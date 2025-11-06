import { useState } from "react";
import { DragEndEvent, DragStartEvent, DragMoveEvent } from "@dnd-kit/core";
import { FEElement } from "../types";
import { findParentId, isDescendant, removeElement } from "../utils/treeUtils";
import { isFullyInside, isCompletelyOutside, getElementRect, getCanvasRect } from "../utils/collisionUtils";

export function useDndCanvas({
  elements,
  setElements,
  onSelectElement,
  onDragElement,
}: {
  elements: FEElement[];
  setElements: (elements: FEElement[] | ((prev: FEElement[]) => FEElement[])) => void;
  onSelectElement?: (id: string) => void;
  onDragElement?: (draggedId: string, targetId: string | null, position: "before" | "after" | "inside") => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [shouldDetach, setShouldDetach] = useState<boolean>(false);

  const handleDragStart = (event: DragStartEvent) => {
    const elementId = event.active.id as string;
    setActiveId(elementId);
    setShouldDetach(false);

    // Select the element being dragged
    if (onSelectElement) {
      onSelectElement(elementId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!delta) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    const activeId = active.id as string;
    const currentParentId = findParentId(elements, activeId);

    // Decision tree:
    // 1. If fully inside another element (overId set) -> nest inside it
    // 2. If shouldDetach flag is true -> detach child to root canvas
    // 3. If root element -> just update position
    // 4. If child and still inside parent -> do nothing

    if (overId && onDragElement) {
      // Case 1: Nest inside another element
      onDragElement(activeId, overId, "inside");
    } else if (shouldDetach) {
      // Case 2: Child was pulled outside parent -> detach to root at current drag position
      setElements((prevElements) => {
        const { tree, removed } = removeElement(prevElements, activeId);

        if (removed) {
          const draggedRect = getElementRect(activeId);
          const canvasRect = getCanvasRect();

          if (draggedRect && canvasRect) {
            return [
              ...tree,
              {
                ...removed,
                canvasPosition: {
                  x: draggedRect.left - canvasRect.left + delta.x,
                  y: draggedRect.top - canvasRect.top + delta.y,
                },
              },
            ];
          }
        }

        return prevElements;
      });
    } else if (!currentParentId) {
      // Case 3: Root element moving on canvas
      setElements((prevElements) => {
        const updatePosition = (elements: FEElement[]): FEElement[] => {
          return elements.map((el) => {
            if (el.id === activeId && el.type !== 'text') {
              return {
                ...el,
                canvasPosition: {
                  x: (el.canvasPosition?.x || 0) + delta.x,
                  y: (el.canvasPosition?.y || 0) + delta.y,
                },
              };
            }
            return el;
          });
        };

        return updatePosition(prevElements);
      });
    }
    // If child is still inside parent and no new parent -> do nothing

    setActiveId(null);
    setOverId(null);
    setShouldDetach(false);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { over, active, delta } = event;

    if (!active || !delta) {
      setOverId(null);
      return;
    }

    const activeId = active.id as string;
    const currentParentId = findParentId(elements, activeId);

    // If element is a child, check if it's been dragged outside its parent
    if (currentParentId) {
      const activeRect = getElementRect(activeId);
      const parentRect = getElementRect(currentParentId);

      if (activeRect && parentRect) {
        const currentRect = {
          left: activeRect.left + delta.x,
          right: activeRect.right + delta.x,
          top: activeRect.top + delta.y,
          bottom: activeRect.bottom + delta.y,
          width: activeRect.width,
          height: activeRect.height,
        } as DOMRect;

        // If completely outside parent, mark for detachment
        if (isCompletelyOutside(currentRect, parentRect)) {
          setShouldDetach(true);
        } else {
          // Still inside parent, don't detach
          setShouldDetach(false);
        }
      }
    }

    // If not over anything, clear overId
    if (!over) {
      setOverId(null);
      return;
    }

    const currentOverId = over.id as string;

    // Don't nest inside self
    if (currentOverId === activeId) {
      setOverId(null);
      return;
    }

    // Prevent nesting parent inside its own descendant
    if (isDescendant(activeId, currentOverId, elements)) {
      setOverId(null);
      return;
    }

    // Check if dragged element is fully inside the over element
    const activeRect = getElementRect(activeId);
    const overRect = getElementRect(currentOverId);

    if (activeRect && overRect) {
      const currentRect = {
        left: activeRect.left + delta.x,
        right: activeRect.right + delta.x,
        top: activeRect.top + delta.y,
        bottom: activeRect.bottom + delta.y,
        width: activeRect.width,
        height: activeRect.height,
      } as DOMRect;

      if (isFullyInside(currentRect, overRect)) {
        setOverId(currentOverId);
      } else {
        setOverId(null);
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setShouldDetach(false);
  };

  // Find the active element for the DragOverlay
  const findElement = (elements: FEElement[], id: string): FEElement | null => {
    for (const el of elements) {
      if (el.id === id) return el;
      if (el.type !== 'text' && el.children) {
        const found = findElement(el.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeElement = activeId ? findElement(elements, activeId) : null;

  return {
    activeId,
    activeElement,
    overId,
    isDragging: !!activeId,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
