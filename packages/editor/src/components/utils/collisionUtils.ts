/**
 * Check if element A is fully inside element B
 */
export function isFullyInside(rectA: DOMRect, rectB: DOMRect): boolean {
  return (
    rectA.left >= rectB.left &&
    rectA.right <= rectB.right &&
    rectA.top >= rectB.top &&
    rectA.bottom <= rectB.bottom
  );
}

/**
 * Check if element A is completely outside element B
 */
export function isCompletelyOutside(rectA: DOMRect, rectB: DOMRect): boolean {
  return (
    rectA.right < rectB.left ||
    rectA.left > rectB.right ||
    rectA.bottom < rectB.top ||
    rectA.top > rectB.bottom
  );
}

/**
 * Get element's bounding rect by its data-element-id
 */
export function getElementRect(elementId: string): DOMRect | null {
  const element = document.querySelector(`[data-element-id="${elementId}"]`);
  return element ? element.getBoundingClientRect() : null;
}

/**
 * Get canvas bounding rect
 */
export function getCanvasRect(): DOMRect | null {
  const canvas = document.querySelector('.w-full.h-full.relative');
  return canvas ? canvas.getBoundingClientRect() : null;
}

/**
 * Convert screen coordinates to canvas-relative coordinates
 */
export function screenToCanvas(screenX: number, screenY: number): { x: number; y: number } | null {
  const canvasRect = getCanvasRect();
  if (!canvasRect) return null;

  return {
    x: screenX - canvasRect.left,
    y: screenY - canvasRect.top,
  };
}
