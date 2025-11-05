import { useState } from "react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { FEElement } from "../types";

export function useDndCanvas({
  elements,
  setElements,
  onSelectElement,
}: {
  elements: FEElement[];
  setElements: (elements: FEElement[] | ((prev: FEElement[]) => FEElement[])) => void;
  onSelectElement?: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialRect, setInitialRect] = useState<{ x: number; y: number } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const elementId = event.active.id as string;
    setActiveId(elementId);

    // Select the element being dragged
    if (onSelectElement) {
      onSelectElement(elementId);
    }

    // Get the element's position on screen
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setInitialRect({ x: rect.left, y: rect.top });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!delta) {
      setActiveId(null);
      return;
    }

    // Find the element that was dragged and update its position
    setElements((prevElements) => {
      const updatePosition = (elements: FEElement[]): FEElement[] => {
        return elements.map((el) => {
          if (el.id === active.id) {
            return {
              ...el,
              canvasPosition: {
                x: (el.canvasPosition?.x || 0) + delta.x,
                y: (el.canvasPosition?.y || 0) + delta.y,
              },
            };
          }
          return { ...el, children: updatePosition(el.children) };
        });
      };

      return updatePosition(prevElements);
    });

    setActiveId(null);
    setInitialRect(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setInitialRect(null);
  };

  // Find the active element for the DragOverlay
  const findElement = (elements: FEElement[], id: string): FEElement | null => {
    for (const el of elements) {
      if (el.id === id) return el;
      if (el.children) {
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
    initialRect,
    isDragging: !!activeId,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
