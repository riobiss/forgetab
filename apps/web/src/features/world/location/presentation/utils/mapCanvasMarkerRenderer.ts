import Konva from "konva"
import type {
  MapMarkerItem,
  MarkerGroup,
  PendingMarker
} from "@/features/world/location/presentation/types/mapMarkers"
import { drawMarkerPin, getMarkerDisplayLabel } from "./markerPins"
import {
  getMarkerRenderMode,
  isMarkerVisibleInViewport
} from "./mapCanvasStage"

export function redrawPersistedMarkerLayer(params: {
  stage: Konva.Stage
  layer: Konva.Layer
  mapImage: Konva.Image | null
  groups: MarkerGroup[]
  visibleGroupIds: string[]
  markersVisible: boolean
  editingMarker: MapMarkerItem | null
  markerSelectionMode: boolean
  onSelect: (marker: MapMarkerItem, color: string) => void
}) {
  params.layer.destroyChildren()
  const renderMode = getMarkerRenderMode(params.stage, params.mapImage)
  const visibleGroupIds = new Set(params.visibleGroupIds)

  if (params.markersVisible) {
    for (const group of params.groups) {
      if (!visibleGroupIds.has(group.id)) continue
      group.markers.forEach((marker, index) => {
        if (marker.id === params.editingMarker?.id) return
        const color = marker.color || group.color
        const label = getMarkerDisplayLabel(marker.name, index + 1)
        if (!isMarkerVisibleInViewport(params.stage, marker, label)) return
        drawMarkerPin({
          layer: params.layer,
          x: marker.x,
          y: marker.y,
          color,
          label,
          size: marker.size,
          pinStyle: marker.pinStyle,
          renderMode,
          opacity: 0.95,
          onClick: () => {
            if (!params.markerSelectionMode) params.onSelect(marker, color)
          }
        })
      })
    }
  }
  params.layer.batchDraw()
}

export function redrawPendingMarkerLayer(params: {
  stage: Konva.Stage
  layer: Konva.Layer
  mapImage: Konva.Image | null
  pendingMarkers: PendingMarker[]
  editingMarker: MapMarkerItem | null
  markerGroupColor: string
  markerRepositionMode: boolean
}) {
  params.layer.destroyChildren()
  const renderMode = getMarkerRenderMode(params.stage, params.mapImage)
  if (params.editingMarker) {
    drawMarkerPin({
      layer: params.layer,
      x: params.editingMarker.x,
      y: params.editingMarker.y,
      color: params.editingMarker.color || params.markerGroupColor,
      label: getMarkerDisplayLabel(params.editingMarker.name, 1),
      size: params.editingMarker.size,
      pinStyle: params.editingMarker.pinStyle,
      renderMode,
      opacity: 0.95,
      dashed: params.markerRepositionMode
    })
  }
  params.pendingMarkers.forEach((marker, index) => {
    const label = getMarkerDisplayLabel(marker.name, index + 1)
    if (!isMarkerVisibleInViewport(params.stage, marker, label)) return
    drawMarkerPin({
      layer: params.layer,
      x: marker.x,
      y: marker.y,
      color: params.markerGroupColor,
      label,
      size: marker.size,
      pinStyle: marker.pinStyle,
      renderMode,
      opacity: 0.82,
      dashed: true
    })
  })
  params.layer.batchDraw()
}
