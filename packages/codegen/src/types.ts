// Core FEElement types (shared between editor and codegen)
// Note: Excludes canvas-specific properties like canvasPosition

export interface TextLeafNode {
  id: string;
  type: 'text';
  tag: 'span';
  styles?: Record<string, any>; // React.CSSProperties
  text?: string;
}

export interface HtmlElement {
  id: string;
  type: 'html';
  tag: string;
  props?: Record<string, any>; // HTML attributes like className, id, etc.
  styles?: Record<string, any>; // React.CSSProperties
  children?: FEElement[];
}

export interface ComponentElement {
  id: string;
  type: "component";
  componentName: string;
  props?: Record<string, any>;
  styles?: Record<string, any>; // React.CSSProperties
  children?: FEElement[];
}

export type FEElement = HtmlElement | ComponentElement | TextLeafNode

// Canvas persistence types
export interface CanvasData {
  id: string                    // Slug: "homepage-hero"
  name: string                  // Display: "Homepage Hero"
  elements: FEElement[]
  createdAt: string
  updatedAt: string
  zoom?: number
  pan?: { x: number; y: number }
  metadata?: {
    description?: string
    tags?: string[]
  }
}
