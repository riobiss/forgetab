import type { MapMarkerItem } from "./mapMarkers"

export type WorldMapCanvasHandle = {
  syncToContainer: () => void
  resetView: () => void
  clearLastDrawing: () => void
  focusMarker: (marker: Pick<MapMarkerItem, "x" | "y">) => void
}
