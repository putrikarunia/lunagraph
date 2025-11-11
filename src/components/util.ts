import { FEElement } from "./types";

export const findElement = (els: FEElement[], id: string): FEElement | null => {
  if (!els || els.length === 0) return null;
  for (const el of els) {
    if (el.id === id) return el;
    if (el.type !== 'text' && el.children) {
      const found = findElement(el.children, id);
      if (found) return found;
    }
  }
  return null;
};
