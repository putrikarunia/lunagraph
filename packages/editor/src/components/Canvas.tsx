import { useRef, useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { FEElement, ResizingState } from "./types";
import { useHoverAndSelectionOverlay } from "./hooks/useHoverAndSelectionOverlay";
import { useResizing } from "./hooks/useResizing";
import { usePotentialParentOverlay } from "./hooks/usePotentialParentOverlay";
import { renderElement, SelectionMode } from "./utils/renderElement";
import { ZoomControls } from "./ZoomControls";
import { Text } from "./ui/Text";
import { DiamondsFour, X } from "@phosphor-icons/react";

export function Canvas({
  elements,
  selectedElementId,
  hoverElementId,
  onSelectElement,
  onHoverElement,
  onResizeElement,
  onEditText,
  editingTextId,
  onStartEditText,
  onStopEditText,
  isDragging = false,
  potentialParentId = null,
  components = {},
  componentIndex = {},
  editingFile = null,
  onCloseEdit,
  onZoomChange,
  cmdPressed = false,
  onDoubleClickDrillIn,
}: {
  elements: FEElement[];
  selectedElementId: string | null;
  hoverElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onHoverElement: (id: string | null) => void;
  onResizeElement: (
    id: string,
    size: { width: number; height: number },
    position?: { x: number; y: number }
  ) => void;
  onEditText: (id: string, text: string) => void;
  editingTextId: string | null;
  onStartEditText: (id: string) => void;
  onStopEditText: () => void;
  isDragging?: boolean;
  potentialParentId?: string | null;
  components?: Record<string, React.ComponentType<any>>;
  componentIndex?: Record<string, any>;
  editingFile?: string | null;
  onCloseEdit?: () => void;
  onZoomChange?: (zoom: number) => void;
  cmdPressed?: boolean;
  onDoubleClickDrillIn?: (elementId: string, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [resizing, setResizing] = useState<ResizingState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [transformState, setTransformState] = useState({ scale: 1, positionX: 0, positionY: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Determine selection mode based on Cmd key and selection state
  // - Cmd pressed: always select deepest (leaf) element
  // - Nothing selected + No Cmd: select topmost (shallowest) element
  // - Something selected + No Cmd: select deepest (smart navigation)
  const selectionMode: SelectionMode = cmdPressed
    ? 'deepest'
    : (selectedElementId === null ? 'topmost' : 'deepest');

  const {handleResizeStart} = useResizing({
    resizing,
    setResizing,
    onResizeElement,
    transform: transformState
  })

  const { renderSelectionOverlay, renderHoverOverlay } = useHoverAndSelectionOverlay({
    canvasRef,
    elements,
    selectedElementId,
    hoverElementId,
    handleResizeStart,
    transform: transformState
  })

  const { renderPotentialParentOverlay } = usePotentialParentOverlay({
    canvasRef,
    potentialParentId,
    transform: transformState
  })

  // Track space key for left-click panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Extract component name from file path (e.g., "components/ui/button.tsx" -> "button")
  const getComponentNameFromPath = (path: string) => {
    const fileName = path.split('/').pop() || ''
    return fileName.replace(/\.tsx?$/, '')
  }

  const componentName = editingFile ? getComponentNameFromPath(editingFile) : null

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ width: '100%', height: '100%' }}>
      {/* Editing header */}
      {editingFile && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-accent/50">
          <div className="flex items-center gap-2">
            <Text size="sm" weight="medium" variant="secondary">Editing</Text>
            <div className="flex items-center gap-1.5">
              <DiamondsFour size={14} weight="fill" className="text-purple-500" />
              <Text size="sm" weight="medium">{componentName}</Text>
            </div>
          </div>
          <button
            onClick={onCloseEdit}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X size={16} weight="bold" className="text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ cursor: spacePressed ? 'grab' : 'default' }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={5}
        limitToBounds={false}
        centerOnInit={false}
        wheel={{
          step: 0.1,
          disabled: false,
          activationKeys: ['Meta', 'Control'],
        }}
        panning={{
          disabled: false,
          velocityDisabled: true,
          allowLeftClickPan: spacePressed,
          allowRightClickPan: false,
          allowMiddleClickPan: true,
        }}
        doubleClick={{ disabled: true }}
        onTransformed={(ref, state) => {
          setZoom(state.scale);
          setTransformState(state);
          if (onZoomChange) {
            onZoomChange(state.scale);
          }
        }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full"
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <div
            className="relative"
            style={{ width: '4000px', height: '4000px' }}
            ref={canvasRef}
            onClick={(e) => {
              // Only clear selection if clicking canvas background itself
              if (e.target === e.currentTarget) {
                onSelectElement(null);
              }
            }}
            onMouseOver={(e) => {
              // Only clear hover if hovering canvas background itself
              if (e.target === e.currentTarget) {
                onHoverElement(null);
              }
            }}
          >
            {elements.filter(el => el.type !== 'text').map((el) =>
              <div
                key={el.id}
                className="absolute"
                style={{
                  top: el.canvasPosition?.y || 20,
                  left: el.canvasPosition?.x || 20,
                }}
              >
              {renderElement(el, {
                onSelectElement,
                onHoverElement,
                onDoubleClickElement: onDoubleClickDrillIn,
                components,
                componentIndex,
                onEditText,
                editingTextId,
                onStartEditText,
                onStopEditText,
                selectionMode,
              })}
              </div>
            )}
          </div>
        </TransformComponent>

        {/* Overlays rendered outside TransformComponent so they don't scale */}
        <div className="absolute inset-0 pointer-events-none" data-overlay-container>
          {/* Selection overlay - hide while dragging */}
          {!isDragging && renderSelectionOverlay()}
          {!isDragging && renderHoverOverlay()}

          {/* Potential parent overlay - show while dragging */}
          {isDragging && renderPotentialParentOverlay()}
        </div>

        {/* Zoom controls */}
        <ZoomControls zoom={zoom} />
      </TransformWrapper>
      </div>
    </div>
  );
}
