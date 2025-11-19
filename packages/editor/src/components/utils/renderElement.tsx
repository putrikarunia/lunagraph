import { createElement, Fragment } from "react";
import { FEElement } from "../types";
import { DraggableElement } from "../DraggableElement";

export type SelectionMode = 'topmost' | 'deepest';

export function renderElement(
  element: FEElement,
  options: {
    isDragPreview?: boolean;
    onSelectElement?: (id: string) => void;
    onHoverElement?: (id: string | null) => void;
    onDoubleClickElement?: (id: string, x: number, y: number) => void;
    components?: Record<string, React.ComponentType<any>>;
    componentIndex?: Record<string, any>;
    onEditText?: (id: string, text: string) => void;
    editingTextId?: string | null;
    onStartEditText?: (id: string) => void;
    onStopEditText?: () => void;
    selectionMode?: SelectionMode;
  } = {}
): React.ReactNode {
  const { isDragPreview = false, selectionMode = 'deepest' } = options;

  // In 'deepest' mode: stopPropagation to select deepest element
  // In 'topmost' mode: don't stopPropagation, let event bubble to topmost parent
  const shouldStopPropagation = selectionMode === 'deepest';

  const commonProps = {
    "data-element-id": element.id,
    onClick: options.onSelectElement
      ? (e: React.MouseEvent) => {
          if (shouldStopPropagation && element.type !== "text") {
            e.stopPropagation();
          }
          options.onSelectElement!(element.id);
        }
      : undefined,
    onDoubleClick: options.onDoubleClickElement
      ? (e: React.MouseEvent) => {
          if (shouldStopPropagation && element.type !== "text") {
            e.stopPropagation();
          }
          options.onDoubleClickElement!(element.id, e.clientX, e.clientY);
        }
      : undefined,
    onMouseOver: options.onHoverElement
      ? (e: React.MouseEvent) => {
          if (shouldStopPropagation && element.type !== "text") {
            e.stopPropagation();
          }
          options.onHoverElement!(element.id);
        }
      : undefined,
    onMouseLeave: options.onHoverElement
      ? (e: React.MouseEvent) => {
          if (shouldStopPropagation && element.type !== "text") {
            e.stopPropagation();
          }
          options.onHoverElement!(null);
        }
      : undefined,
  };

  let content = <div>Default Content</div>;

  // Helper to render slot placeholder
  const renderSlot = () => {
    return <div className="pointer-events-none flex items-center justify-center p-2 rounded border border-black/20 border-dashed flex-1 text-xs">
      Drop contents
    </div>
  }

  if (element.type === "html") {
    // Check if element has no children - render slot placeholder
    const hasChildren = element.children && element.children.length > 0;

    content = createElement(
      element.tag ?? 'div',
      {
        ...(element as any).props,  // Include props (e.g., className, id, etc.)
        style: element.styles,
        ...commonProps,
      },
      hasChildren
        ? element.children?.map((child) => renderElement(child, { ...options }))
        : renderSlot()
    );
  } else if (element.type === "text") {
    // Text nodes - editable on double click
    const isEditing = options.editingTextId === element.id;

    if (isEditing) {
      // Render input when editing
      return createElement('input', {
        key: element.id,
        type: 'text',
        defaultValue: element.text || '',
        autoFocus: true,
        'data-text-element': 'true',
        style: {
          ...element.styles,
          border: 'none',
          outline: '2px solid #3b82f6',
          background: 'transparent',
          font: 'inherit',
          padding: '2px 4px',
          margin: '-2px -4px',
          minWidth: '100px',
        },
        onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
          if (options.onEditText) {
            options.onEditText(element.id, e.target.value);
          }
          if (options.onStopEditText) {
            options.onStopEditText();
          }
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            // Revert to original text
            e.currentTarget.value = element.text || '';
            e.currentTarget.blur();
          }
        },
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
        },
      });
    }

    // Render normal span when not editing
    return createElement(
      'span',
      {
        key: element.id,
        style: element.styles,
        ...commonProps,
        'data-text-element': 'true',
        onDoubleClick: (e: React.MouseEvent<HTMLSpanElement>) => {
          e.stopPropagation();
          if (options.onStartEditText) {
            options.onStartEditText(element.id);
          }
        },
      },
      element.text
    );
  } else if (element.type === "component") {
    // Render user component
    const Component = options.components?.[element.componentName];

    // Check if component has children prop defined in index
    const componentInfo = options.componentIndex?.[element.componentName];
    const hasChildrenProp = componentInfo?.props?.children !== undefined;
    const hasChildren = element.children && element.children.length > 0;

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
      // If wrapper has explicit width/height, pass style to component to fill wrapper
      const hasExplicitSize = element.styles && (element.styles.width || element.styles.height);
      const componentStyle = hasExplicitSize
        ? {
            width: element.styles?.width ? '100%' : undefined,
            height: element.styles?.height ? '100%' : undefined,
            ...element.props?.style,  // Merge with existing style prop
          }
        : element.props?.style;

      content = createElement(
        'div',
        {
          style: element.styles,
          ...commonProps,
        },
        createElement(Component, {
          ...element.props,
          style: componentStyle,
        },
        // If component has children prop but no children, show slot
        hasChildrenProp && !hasChildren
          ? renderSlot()
          : element.children?.map((child) => renderElement(child, { ...options }))
        )
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
