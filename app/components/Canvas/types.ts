export interface HtmlElement {
  id: string;
  type: 'html';
  tag: HTMLElement['tagName'];

  // For HTML elements
  content?: string;

  // Common
  styles: React.CSSProperties;
  children: FEElement[];
  canvasPosition?: { // if root in canvas, not inside another element
    x: number,
    y: number,
  }
}

export interface ComponentElement {
  id: string;
  type: "component";

  // For component elements
  componentName?: string;
  props?: Record<string, any>;

  // Common
  styles?: React.CSSProperties;
  children: FEElement[];
  canvasPosition?: { // if root in canvas, not inside another element
    x: number,
    y: number,
  }
}

export type FEElement = HtmlElement | ComponentElement;

export type DraggingState = {
  id: string;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
}

export type ResizingState = {
  id: string;
  handle: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}
