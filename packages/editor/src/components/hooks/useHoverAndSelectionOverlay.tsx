import { useEffect, useState } from "react";
import { FEElement } from "../types";
import { Text } from "../ui/Text";
import { findElement } from "../util";
import { cn } from "../../lib/utils";

export function useHoverAndSelectionOverlay(
  {
    canvasRef,
    elements,
    selectedElementId,
    hoverElementId,
    handleResizeStart,
    transform
  } : {
    canvasRef: React.RefObject<HTMLDivElement | null>,
    elements: FEElement[],
    selectedElementId: string | null,
    hoverElementId: string | null,
    handleResizeStart: (
      e: React.MouseEvent,
      id: string,
      handle: string,
      element: FEElement
    ) => void,
    transform?: { scale: number, positionX: number, positionY: number }
  }
) {

  const [elementRects, setElementRects] = useState<Map<string, DOMRect>>(new Map());

  // Update element positions for overlay
  useEffect(() => {
    const updateRects = () => {
      const newRects = new Map<string, DOMRect>();
      const allElements: FEElement[] = [];

      const collectElements = (els: FEElement[]) => {
        els.forEach((el) => {
          allElements.push(el);
          if (el.type !== 'text' && el.children && el.children.length > 0) {
            collectElements(el.children);
          }
        });
      };

      collectElements(elements);

      allElements.forEach((element) => {
        const domEl = document.querySelector(`[data-element-id="${element.id}"]`);
        if (domEl) {
          newRects.set(element.id, domEl.getBoundingClientRect());
        }
      });

      // Only update if rects actually changed to prevent infinite loops
      setElementRects(prev => {
        if (prev.size !== newRects.size) return newRects;
        let hasChanged = false;
        newRects.forEach((rect, id) => {
          const prevRect = prev.get(id);
          if (!prevRect ||
              prevRect.top !== rect.top ||
              prevRect.left !== rect.left ||
              prevRect.width !== rect.width ||
              prevRect.height !== rect.height) {
            hasChanged = true;
          }
        });
        return hasChanged ? newRects : prev;
      });
    };

    updateRects();
    // Update on resize or scroll
    window.addEventListener('resize', updateRects);
    const observer = new ResizeObserver(updateRects);

    const allElements: FEElement[] = [];
    const collectElements = (els: FEElement[]) => {
      els.forEach((el) => {
        allElements.push(el);
        if (el.type !== 'text' && el.children && el.children.length > 0) {
          collectElements(el.children);
        }
      });
    };
    collectElements(elements);

    allElements.forEach((element) => {
      const domEl = document.querySelector(`[data-element-id="${element.id}"]`);
      if (domEl) observer.observe(domEl);
    });

    return () => {
      window.removeEventListener('resize', updateRects);
      observer.disconnect();
    };
  }, [elements, selectedElementId, transform?.scale, transform?.positionX, transform?.positionY]);

  const renderSelectionOverlay = () => {
    if (!selectedElementId) return null;

    const selectedElement = findElement(elements, selectedElementId);
    if (selectedElement?.type === 'text') return null;

    const selectedRect = elementRects.get(selectedElementId);
    if (!selectedRect) return null;

    // If we have transform, we're outside the TransformComponent
    // Get position relative to the overlay container
    let relativeRect;
    if (transform) {
      const overlayContainer = document.querySelector('[data-overlay-container]');
      if (!overlayContainer) return null;

      const overlayRect = overlayContainer.getBoundingClientRect();

      // Element's screen position - overlay container's screen position = relative position
      relativeRect = {
        left: selectedRect.left - overlayRect.left,
        top: selectedRect.top - overlayRect.top,
        width: selectedRect.width,
        height: selectedRect.height,
      };
    } else {
      const canvasEl = canvasRef?.current;
      if (!canvasEl) return null;
      const canvasRect = canvasEl.getBoundingClientRect();

      relativeRect = {
        left: selectedRect.left - canvasRect.left,
        top: selectedRect.top - canvasRect.top,
        width: selectedRect.width,
        height: selectedRect.height,
      };
    }

    const isComponent = selectedElement?.type === 'component'

    return (
      <div
        className={cn(
          "absolute pointer-events-none outline-2",
          isComponent ? "outline-purple-500" : "outline-blue-500"
        )}
        style={{
          left: relativeRect.left,
          top: relativeRect.top,
          width: relativeRect.width,
          height: relativeRect.height,
        }}
     >
       <div className="absolute -top-5 flex items-center">
         <Text size="xs" className={cn(isComponent ? "text-purple-500" : "text-blue-500")}>
           {selectedElement?.type === 'html' ? selectedElement?.tag : selectedElement?.componentName}
         </Text>
       </div>
       {/* Resize handles */}

        <div
          className={cn(
            "absolute w-2 h-2 bg-white border cursor-nw-resize pointer-events-auto",
            isComponent ? "border-purple-500" : "border-blue-500"
          )}
          style={{ left: -4, top: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "nw", selectedElement)}
        />
        <div
          className={cn(
            "absolute w-2 h-2 bg-white border cursor-ne-resize pointer-events-auto",
            isComponent ? "border-purple-500" : "border-blue-500"
          )}
          style={{ right: -4, top: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "ne", selectedElement)}
        />
        <div
          className={cn(
            "absolute w-2 h-2 bg-white border cursor-sw-resize pointer-events-auto",
            isComponent ? "border-purple-500" : "border-blue-500"
          )}
          style={{ left: -4, bottom: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "sw", selectedElement)}
        />
        <div
          className={cn(
            "absolute w-2 h-2 bg-white border cursor-se-resize pointer-events-auto",
            isComponent ? "border-purple-500" : "border-blue-500"
          )}
          style={{ right: -4, bottom: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "se", selectedElement)}
        />
     </div>
    )
  }

  const renderHoverOverlay = () => {
    if (!hoverElementId) return null;
    if (hoverElementId === selectedElementId) return null;

    const hoveredElement = findElement(elements, hoverElementId);
    if (hoveredElement?.type === 'text') return null;

    const hoveredRect = elementRects.get(hoverElementId);
    if (!hoveredRect) return null;

    // If we have transform, we're outside the TransformComponent
    let relativeRect;
    if (transform) {
      const overlayContainer = document.querySelector('[data-overlay-container]');
      if (!overlayContainer) return null;

      const overlayRect = overlayContainer.getBoundingClientRect();

      relativeRect = {
        left: hoveredRect.left - overlayRect.left,
        top: hoveredRect.top - overlayRect.top,
        width: hoveredRect.width,
        height: hoveredRect.height,
      };
    } else {
      const canvasEl = canvasRef?.current;
      if (!canvasEl) return null;
      const canvasRect = canvasEl.getBoundingClientRect();

      relativeRect = {
        left: hoveredRect.left - canvasRect.left,
        top: hoveredRect.top - canvasRect.top,
        width: hoveredRect.width,
        height: hoveredRect.height,
      };
    }

    const isComponent = hoveredElement?.type === 'component'

    return (
      <div
        className={cn(
          "absolute pointer-events-none outline-1",
          isComponent ? "outline-purple-500" : "outline-blue-500"
        )}
        style={{
          left: relativeRect.left,
          top: relativeRect.top,
          width: relativeRect.width,
          height: relativeRect.height,
        }}
     >
       <div className="absolute -top-5 flex items-center">
         <Text size="xs" className={cn(isComponent ? "text-purple-500" : "text-blue-500")}>
           {hoveredElement?.type === 'html' ? hoveredElement?.tag : hoveredElement?.componentName}
         </Text>
       </div>
     </div>
    )
  }
  return {
    renderSelectionOverlay,
    renderHoverOverlay
  }
}
