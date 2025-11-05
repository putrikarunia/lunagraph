"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs"


import { useState } from "react"
import { FEElement } from "./types"
import CanvasLayout from "./CanvasLayout"
import { Canvas } from "./Canvas"
import { InsertPanel } from "./InsertPanel"
import { LayersPanel } from "./LayersPanel"

export const Editor = () => {
  const [elements, setElements] = useState<FEElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [hoverElementId, setHoverElementId] = useState<string | null>(null)

  const onAddElement = (element: FEElement) => {
    setElements(prev => [...prev, element])
  }

  const onMoveElement = (elementId: string, pos: {x: number, y: number}) => {
    const updateElement = (elements: FEElement[]): FEElement[] => {
      return elements.map((el) => {
        if (el.id === elementId) {
          return { ...el, canvasPosition: {x: pos.x, y: pos.y} };
        }
        return { ...el, children: updateElement(el.children) };
      });
    };

    setElements(el => updateElement(el));
  }


  const onResizeElement = (
    elementId: string,
    size: { width: number; height: number },
    pos?: { x: number; y: number }
  ) => {
    const updateElement = (elements: FEElement[]): FEElement[] => {
      return elements.map((el) => {
        if (el.id === elementId) {
          return {
            ...el,
            styles: {
              ...(el.styles || {}),
              width: size.width,
              height: size.height
            },
            canvasPosition: pos ? {x: pos?.x, y: pos?.y} : undefined
          };
        }
        return { ...el, children: updateElement(el.children) };
      });
    };

    setElements(el => updateElement(el));
  }

  const onDragElement = (
    draggedId: string,
    targetId: string | null,
    position: "before" | "after" | "inside"
  ) => {
    // Find and remove the dragged element from anywhere in the tree
    let draggedElement: FEElement | null = null;

    const findAndRemove = (elements: FEElement[]): FEElement[] => {
      const result: FEElement[] = [];
      for (const el of elements) {
        if (el.id === draggedId) {
          draggedElement = el;
          // Don't include this element
        } else {
          result.push({
            ...el,
            children: findAndRemove(el.children),
          });
        }
      }
      return result;
    };

    // Insert the element at the new position
    const insertElement = (elements: FEElement[]): FEElement[] => {
      const result: FEElement[] = [];

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        if (el.id === targetId) {
          if (position === "before" && draggedElement) {
            result.push(draggedElement);
            result.push(el);
          } else if (position === "after" && draggedElement) {
            result.push(el);
            result.push(draggedElement);
          } else if (position === "inside" && draggedElement) {
            result.push({
              ...el,
              children: [...el.children, draggedElement],
            });
          }
        } else {
          result.push({
            ...el,
            children: insertElement(el.children),
          });
        }
      }

      return result;
    };

    const newElements = findAndRemove(elements);
    const finalElements = insertElement(newElements);
    setElements(finalElements);
  }
  return (<CanvasLayout
    leftChildren={
      <Tabs defaultValue="layers" className="w-full">
        <TabsList>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="insert">Insert</TabsTrigger>
        </TabsList>
        <TabsContent value="layers">
          <LayersPanel
          elements={elements}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onDragElement={onDragElement}
        /></TabsContent>
        <TabsContent value="insert">
          <InsertPanel onAddElement={onAddElement} />
        </TabsContent>
      </Tabs>
    }
  >
    <Canvas
      elements={elements}
      selectedElementId={selectedElementId}
      hoverElementId={hoverElementId}
      onSelectElement={(id: string | null) => setSelectedElementId(id)}
      onHoverElement={(id: string | null) => setHoverElementId(id)}
      onMoveElement={onMoveElement}
      onResizeElement={onResizeElement}
    />
  </CanvasLayout>)
}
