import { createElement, Fragment } from "react";
import { FEElement } from "../types";
import { DraggableElement } from "../DraggableElement";

export function renderElement(
  element: FEElement,
  options: {
    isDragPreview?: boolean;
    onSelectElement?: (id: string) => void;
    onHoverElement?: (id: string | null) => void;
  } = {}
): React.ReactNode {
  const { isDragPreview = false } = options;

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
        renderElement(child, { ...options })
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

  return draggableContent;
}
