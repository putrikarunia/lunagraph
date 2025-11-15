import { useControls } from "react-zoom-pan-pinch";

export function ZoomControls({ zoom }: { zoom: number }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 pointer-events-auto z-50">
      <button
        onClick={(e) => {
          e.stopPropagation();
          zoomOut();
        }}
        className="px-3 py-1.5 hover:bg-gray-100 rounded transition-colors text-sm font-medium"
        title="Zoom Out"
      >
        −
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          resetTransform();
        }}
        className="px-3 py-1.5 hover:bg-gray-100 rounded transition-colors text-xs font-medium min-w-[60px]"
        title="Reset Zoom"
      >
        {zoomPercentage}%
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          zoomIn();
        }}
        className="px-3 py-1.5 hover:bg-gray-100 rounded transition-colors text-sm font-medium"
        title="Zoom In"
      >
        +
      </button>
    </div>
  );
}
