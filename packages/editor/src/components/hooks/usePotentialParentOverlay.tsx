import { RefObject } from "react";

export function usePotentialParentOverlay({
  canvasRef,
  potentialParentId,
  transform
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  potentialParentId: string | null;
  transform?: { scale: number, positionX: number, positionY: number }
}) {
  const renderPotentialParentOverlay = () => {
    if (!potentialParentId) return null;

    // Find the potential parent element in the DOM
    const parentElement = document.querySelector(
      `[data-element-id="${potentialParentId}"]`
    );

    if (!parentElement) return null;

    const parentRect = parentElement.getBoundingClientRect();

    // If we have transform, we're outside the TransformComponent
    // Get position relative to the overlay container
    let relativeRect;
    if (transform) {
      const overlayContainer = document.querySelector('[data-overlay-container]');
      if (!overlayContainer) return null;

      const overlayRect = overlayContainer.getBoundingClientRect();

      // Element's screen position - overlay container's screen position = relative position
      relativeRect = {
        left: parentRect.left - overlayRect.left,
        top: parentRect.top - overlayRect.top,
        width: parentRect.width,
        height: parentRect.height,
      };
    } else {
      const canvasEl = canvasRef?.current;
      if (!canvasEl) return null;
      const canvasRect = canvasEl.getBoundingClientRect();

      relativeRect = {
        left: parentRect.left - canvasRect.left,
        top: parentRect.top - canvasRect.top,
        width: parentRect.width,
        height: parentRect.height,
      };
    }

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
