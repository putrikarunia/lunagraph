import { useDraggable } from "@dnd-kit/core";
import { ReactNode } from "react";

export function DraggableElement({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
  });

  const style = {
    display: isDragging ? undefined : 'contents', // Remove display:contents while dragging so dnd-kit can track position
    opacity: isDragging ? 0 : undefined, // Hide original completely while dragging (Figma-style)
    pointerEvents: isDragging ? 'none' : undefined, // Disable all pointer events on original while dragging
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
