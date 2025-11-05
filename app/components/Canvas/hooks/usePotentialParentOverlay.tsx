import { RefObject } from "react";

export function usePotentialParentOverlay({
  canvasRef,
  potentialParentId,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  potentialParentId: string | null;
}) {
  const renderPotentialParentOverlay = () => {
    if (!potentialParentId || !canvasRef.current) return null;

    // Find the potential parent element in the DOM
    const parentElement = document.querySelector(
      `[data-element-id="${potentialParentId}"]`
    );

    if (!parentElement) return null;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const parentRect = parentElement.getBoundingClientRect();

    // Calculate position relative to canvas
    const relativeRect = {
      left: parentRect.left - canvasRect.left,
      top: parentRect.top - canvasRect.top,
      width: parentRect.width,
      height: parentRect.height,
    };

    return (
      <div
        className="absolute pointer-events-none outline-2 outline-blue-500"
        style={{
          left: relativeRect.left,
          top: relativeRect.top,
          width: relativeRect.width,
          height: relativeRect.height,
        }}
      />
    );
  };

  return { renderPotentialParentOverlay };
}
