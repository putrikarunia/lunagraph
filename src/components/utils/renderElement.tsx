import { createElement, Fragment } from "react";
import { FEElement } from "../types";
import { DraggableElement } from "../DraggableElement";

export function renderElement(
  element: FEElement,
  options: {
    isDragPreview?: boolean;
    onSelectElement?: (id: string) => void;
    onHoverElement?: (id: string | null) => void;
    components?: Record<string, React.ComponentType<any>>;
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
  } else if (element.type === "text") {
    // Text nodes are not draggable - just render directly
    return createElement(
      'span',
      {
        key: element.id,
        style: element.styles,
        ...commonProps,
      },
      element.text
    );
  } else if (element.type === "component") {
    // Render user component
    const Component = options.components?.[element.componentName];

    if (!Component) {
      content = createElement(
        'div',
        {
          style: {
            ...element.styles,
            padding: '12px',
            border: '2px dashed #f59e0b',
            borderRadius: '4px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
          },
          ...commonProps,
        },
        `Component not found: ${element.componentName}`
      );
    } else {
      content = createElement(
        'div',
        {
          style: element.styles,
          ...commonProps,
        },
        createElement(Component, {
          ...element.props,
        },
        element.children?.map((child) =>
          renderElement(child, { ...options })
        ))
      );
    }
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
