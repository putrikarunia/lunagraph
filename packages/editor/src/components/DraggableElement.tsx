import { useDraggable, useDroppable, useDndContext } from "@dnd-kit/core";
import { ReactNode } from "react";

export function DraggableElement({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: id,
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: id,
  });

  // Check if ANY element is being dragged (not just this one)
  const { active } = useDndContext();
  const isAnyDragging = !!active;

  // Combine both refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const style = {
    display: isAnyDragging ? undefined : 'contents', // Remove display:contents during ANY drag so all elements can be droppable
    opacity: isDragging ? 0 : undefined, // Hide original completely while THIS element is dragging (Figma-style)
    pointerEvents: isDragging ? 'none' : undefined, // Disable all pointer events on original while THIS element is dragging
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={(e) => {
        e.preventDefault()
        console.log("DOUBLE CLICK")
      }}
    >
      {children}
    </div>
  );
}
