import { useEffect, useState } from "react";
import { FEElement } from "../types";
import { Text } from "../../ui/Text";
import { findElement } from "../util";

export function useHoverAndSelectionOverlay(
  {
    canvasRef,
    elements,
    selectedElementId,
    hoverElementId,
    handleResizeStart
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
    ) => void
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
          if (el.children.length > 0) {
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
      setElementRects(newRects);
    };

    updateRects();
    // Update on resize or scroll
    window.addEventListener('resize', updateRects);
    const observer = new ResizeObserver(updateRects);

    const allElements: FEElement[] = [];
    const collectElements = (els: FEElement[]) => {
      els.forEach((el) => {
        allElements.push(el);
        if (el.children.length > 0) {
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
  }, [elements, selectedElementId]);

  const renderSelectionOverlay = () => {
    if (!selectedElementId) return null;

    const selectedRect = elementRects.get(selectedElementId);
    if (!selectedRect) return null;

    const canvasEl = canvasRef?.current;
    if (!canvasEl) return null;

    const canvasRect = canvasEl.getBoundingClientRect();
    const relativeRect = {
      left: selectedRect.left - canvasRect.left,
      top: selectedRect.top - canvasRect.top,
      width: selectedRect.width,
      height: selectedRect.height,
    };

    const selectedElement = findElement(elements, selectedElementId);

    return (
      <div
        className="absolute pointer-events-none outline-2 outline-selection"
        style={{
          left: relativeRect.left,
          top: relativeRect.top,
          width: relativeRect.width,
          height: relativeRect.height,
        }}
     >
       <div className="absolute -top-5 flex items-center">
         <Text size="xs" variant="selection">
           {selectedElement?.type === 'html' ? selectedElement?.tag : selectedElement?.componentName}
         </Text>
       </div>
       {/* Resize handles - only for non-component elements */}

        <div
          className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize pointer-events-auto"
          style={{ left: -4, top: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "nw", selectedElement)}
        />
        <div
          className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize pointer-events-auto"
          style={{ right: -4, top: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "ne", selectedElement)}
        />
        <div
          className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize pointer-events-auto"
          style={{ left: -4, bottom: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "sw", selectedElement)}
        />
        <div
          className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-se-resize pointer-events-auto"
          style={{ right: -4, bottom: -4 }}
          onMouseDown={(e) => selectedElement && handleResizeStart(e, selectedElementId, "se", selectedElement)}
        />
     </div>
    )
  }

  const renderHoverOverlay = () => {
    if (!hoverElementId) return null;
    if (hoverElementId === selectedElementId) return null;

    const hoveredRect = elementRects.get(hoverElementId);
    if (!hoveredRect) return null;

    const canvasEl = canvasRef?.current;
    if (!canvasEl) return null;

    const canvasRect = canvasEl.getBoundingClientRect();
    const relativeRect = {
      left: hoveredRect.left - canvasRect.left,
      top: hoveredRect.top - canvasRect.top,
      width: hoveredRect.width,
      height: hoveredRect.height,
    };

    const hoveredElement = findElement(elements, hoverElementId);

    return (
      <div
        className="absolute pointer-events-none outline-1 outline-selection"
        style={{
          left: relativeRect.left,
          top: relativeRect.top,
          width: relativeRect.width,
          height: relativeRect.height,
        }}
     >
       <div className="absolute -top-5 flex items-center">
         <Text size="xs" variant="selection">
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
