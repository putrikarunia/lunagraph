"use client";

import { FEElement } from "./types";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { CaretDownIcon, CaretRightIcon, CodeIcon, TextT } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface LayersPanelProps {
  elements: FEElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onDragElement?: (draggedId: string, targetId: string | null, position: "before" | "after" | "inside") => void;
}

function DropIndicatorLine ({show, depth, position}: {show: boolean, depth: number, position: 'before' | 'after'}) {
  return <div className={cn("absolute left-0 right-0 h-0.5 bg-selection pointer-events-none opacity-0 transition-all duration-100 -translate-y-1/2",
    position === 'before' ? 'top-0' : 'bottom-0',
    show && "opacity-100 h-1")} style={{ marginLeft: `${depth * 16 + 12}px`, marginRight: '12px' }} />
}

export function LayersPanel({
  elements,
  selectedElementId,
  onSelectElement,
  onDragElement,
}: LayersPanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, hasChildren: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // For elements without children, use 50/50 split for before/after
    // For elements with children, use 33/33/33 split for before/inside/after
    if (!hasChildren) {
      if (y < height * 0.5) {
        setDropPosition("before");
      } else {
        setDropPosition("after");
      }
    } else {
      if (y < height * 0.33) {
        setDropPosition("before");
      } else if (y > height * 0.67) {
        setDropPosition("after");
      } else {
        setDropPosition("inside");
      }
    }

    setDropTargetId(targetId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the element entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || !onDragElement || draggedId === targetId) {
      setDraggedId(null);
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    if (dropPosition) {
      onDragElement(draggedId, targetId, dropPosition);
    }

    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  const getElementIcon = (element: FEElement) => {
    if (element.type === 'text') {
      return <TextT size={16} weight="regular" className="text-muted-foreground" />;
    }
    return <CodeIcon size={16} weight="regular" className="text-muted-foreground" />;
  };

  const getElementLabel = (element: FEElement): string => {
    if (element.type === "component") {
      return element.componentName || "Component";
    }
    if (element.type === "html") {
      return element.tag || "Element";
    }
    if (element.type === "text") {
      return element.text || "Text";
    }
    return "Element";
  };

  const renderLayerItem = (element: FEElement, depth: number = 0) => {
    const isSelected = selectedElementId === element.id;
    const isCollapsed = collapsedIds.has(element.id);
    const hasChildren = Boolean(element.type !== 'text' && element.children && element.children?.length > 0);
    const isDragging = draggedId === element.id;
    const isDropTarget = dropTargetId === element.id;

    return (
      <div key={element.id} className="relative">
        {/* Drop indicator line - before */}
        <DropIndicatorLine show={ isDropTarget && dropPosition === "before" } depth={depth} position="before" />

        <div
          draggable
          onDragStart={(e) => handleDragStart(e, element.id)}
          onDragOver={(e) => handleDragOver(e, element.id, hasChildren)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, element.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-accent/50 transition-colors group relative border border-transparent border-solid",
            isSelected && "bg-accent",
            isDragging && "opacity-50",
            isDropTarget && dropPosition === "inside" && hasChildren && "bg-selection/10 border-selection"
          )}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => onSelectElement(element.id)}
        >
          {/* Collapse/Expand button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-2 w-2"
              isChildText={false}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(element.id);
              }}
            >
              {isCollapsed ? (
                <CaretRightIcon size={8} weight="bold" className="text-muted-foreground" />
              ) : (
                <CaretDownIcon size={8} weight="bold" className="text-muted-foreground" />
              )}
            </Button>
          ) : (
            <div className="w-2" />
          )}

          {/* Element icon */}
          <div className="shrink-0">
            {getElementIcon(element)}
          </div>

          {/* Element label */}
          <Text
            size="sm"
            variant="primary"
            className="flex-1 truncate select-none"
          >
            {getElementLabel(element)}
          </Text>
        </div>

        {/* Drop indicator line - after */}
        <DropIndicatorLine show={ isDropTarget && dropPosition === "after" } depth={depth} position="after" />

        {/* Render children */}
        {hasChildren && !isCollapsed && element.type !== 'text' && (
          <div>
            {element.children?.map((child: FEElement) => renderLayerItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Text size="xs" weight="semibold" variant="primary">
          Layers
        </Text>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {elements.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Text size="sm" variant="tertiary">
              No layers yet
            </Text>
          </div>
        ) : (
          <div className="py-1">
            {elements.map((element) => renderLayerItem(element))}
          </div>
        )}
      </div>
    </div>
  );
}
