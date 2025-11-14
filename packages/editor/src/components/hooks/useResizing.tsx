import { Dispatch, SetStateAction, useEffect } from "react";
import { ResizingState, FEElement } from "../types";

export function useResizing({
  resizing,
  setResizing,
  onResizeElement,
}: {
  resizing: ResizingState | null;
  setResizing: Dispatch<SetStateAction<ResizingState | null>>;
  onResizeElement: (
    id: string,
    size: { width: number; height: number },
    position?: { x: number; y: number }
  ) => void;
}) {
  const handleResizeStart = (
    e: React.MouseEvent,
    id: string,
    handle: string,
    element: FEElement
  ) => {
    e.stopPropagation();

    // Get the actual element to measure its current dimensions
    const domElement = e.currentTarget.parentElement?.parentElement?.querySelector(
      `[data-element-id="${id}"]`
    ) as HTMLElement;
    const rect = domElement?.getBoundingClientRect() || {
      width: 100,
      height: 100,
    };

    // Convert width/height to numbers, using actual dimensions if "auto"
    const currentWidth =
      element.type === "html" && typeof element.styles?.width === "number"
        ? element.styles?.width
        : rect.width;
    const currentHeight =
      element.type === "html" && typeof element.styles?.height === "number"
        ? element.styles?.height
        : rect.height;

    setResizing({
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentWidth,
      startHeight: currentHeight,
      startLeft: 'canvasPosition' in element && element.canvasPosition?.x || 0,
      startTop: 'canvasPosition' in element && element.canvasPosition?.y || 0,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const deltaX = e.clientX - resizing.startX;
        const deltaY = e.clientY - resizing.startY;

        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newLeft = resizing.startLeft;
        let newTop = resizing.startTop;

        if (resizing.handle.includes("e")) {
          newWidth = Math.max(50, resizing.startWidth + deltaX);
        }
        if (resizing.handle.includes("w")) {
          newWidth = Math.max(50, resizing.startWidth - deltaX);
          newLeft = resizing.startLeft + deltaX;
        }
        if (resizing.handle.includes("s")) {
          newHeight = Math.max(30, resizing.startHeight + deltaY);
        }
        if (resizing.handle.includes("n")) {
          newHeight = Math.max(30, resizing.startHeight - deltaY);
          newTop = resizing.startTop + deltaY;
        }

        onResizeElement(
          resizing.id,
          { width: newWidth, height: newHeight },
          { x: newLeft, y: newTop }
        );
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing, setResizing, onResizeElement]);

  return {
    handleResizeStart,
  };
}
