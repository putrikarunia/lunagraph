import { createElement, Fragment } from "react";
import { FEElement } from "../types";
import { DraggableElement } from "../DraggableElement";

export function renderElement(
  element: FEElement,
  options: {
    isRoot?: boolean;
    isDragPreview?: boolean;
    onSelectElement?: (id: string) => void;
    onHoverElement?: (id: string | null) => void;
  } = {}
): React.ReactNode {
  const { isRoot = false, isDragPreview = false } = options;

  const commonProps = {
    "data-element-id": element.id,
    onClick: options.onSelectElement
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          options.onSelectElement!(element.id);
        }
      : undefined,
    onMouseOver: options.onHoverElement
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          options.onHoverElement!(element.id);
        }
      : undefined,
    onMouseLeave: options.onHoverElement
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          options.onHoverElement!(null);
        }
      : undefined,
  };

  let content = <div>Default Content</div>;

  if (element.type === "html") {
    content = createElement(
      element.tag ?? 'div',
      {
        style: element.styles,
        ...commonProps,
      },
      element.children?.map((child) =>
        renderElement(child, { ...options, isRoot: false })
      )
    );
  }

  // Wrap with DraggableElement (unless it's a drag preview)
  const draggableContent = isDragPreview ? (
    <Fragment key={element.id}>{content}</Fragment>
  ) : (
    <DraggableElement key={element.id} id={element.id}>
      {content}
    </DraggableElement>
  );

  // If root element, wrap with absolute positioning
  if (isRoot && element.canvasPosition) {
    return (
      <div
        key={element.id}
        className="absolute"
        style={{
          top: element.canvasPosition.y || 20,
          left: element.canvasPosition.x || 20,
        }}
      >
        {draggableContent}
      </div>
    );
  }

  return draggableContent;
}
