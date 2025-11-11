import { FEElement } from "../types";

/**
 * Find an element in the tree by ID
 */
export function findElement(elements: FEElement[], id: string): FEElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findElement(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find the parent ID of an element
 */
export function findParentId(elements: FEElement[], childId: string): string | null {
  for (const el of elements) {
    if (el.children) {
      for (const child of el.children) {
        if (child.id === childId) return el.id;
      }
      const foundInChildren = findParentId(el.children, childId);
      if (foundInChildren) return foundInChildren;
    }
  }
  return null;
}

/**
 * Check if an element is a descendant of another
 */
export function isDescendant(parentId: string, childId: string, elements: FEElement[]): boolean {
  const parent = findElement(elements, parentId);
  if (!parent || !parent.children) return false;
  return !!findElement(parent.children, childId);
}

/**
 * Remove an element from the tree and return both the new tree and the removed element
 */
export function removeElement(
  elements: FEElement[],
  idToRemove: string
): { tree: FEElement[]; removed: FEElement | null } {
  let removedElement: FEElement | null = null;

  const remove = (elements: FEElement[]): FEElement[] => {
    const result: FEElement[] = [];
    for (const el of elements) {
      if (el.id === idToRemove) {
        removedElement = el;
      } else {
        result.push({
          ...el,
          children: el.children ? remove(el.children) : [],
        });
      }
    }
    return result;
  };

  return { tree: remove(elements), removed: removedElement };
}

/**
 * Update an element's position in the tree
 */
export function updateElementPosition(
  elements: FEElement[],
  id: string,
  position: { x: number; y: number }
): FEElement[] {
  return elements.map((el) => {
    if (el.id === id) {
      return {
        ...el,
        canvasPosition: position,
      };
    }
    return { ...el, children: el.children ? updateElementPosition(el.children, id, position) : [] };
  });
}
