import { FEElement } from "./types";

export const findElement = (els: FEElement[], id: string): FEElement | null => {
  for (const el of els) {
    if (el.id === id) return el;
    const found = findElement(el.children, id);
    if (found) return found;
  }
  return null;
};
