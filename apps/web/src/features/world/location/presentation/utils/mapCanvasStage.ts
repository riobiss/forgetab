import type { MutableRefObject } from "react"
import Konva from "konva"
import type { MapMarkerItem } from "@/features/world/location/presentation/types/mapMarkers"
import type { MarkerRenderMode } from "@/features/world/location/presentation/utils/markerPins"
import {
  calculatePinchViewport,
  getLocalPinchCenter,
  preserveViewportOnResize,
} from "@/features/world/location/presentation/utils/mapZoom"

export type MapCanvasPoint = { x: number; y: number }

const MARKER_VIEWPORT_PADDING = 132

export function syncMapInteraction(
  stage: Konva.Stage | null,
  isInteractive: boolean,
  isBrushMode: boolean,
  isFullscreen: boolean,
  isMarkerSelectionMode: boolean,
  isPinching: boolean,
) {
  if (!stage) return

  stage.draggable(
    isInteractive &&
      isFullscreen &&
      !isBrushMode &&
      !isMarkerSelectionMode &&
      !isPinching,
  )
}

export function applyStageZoom(
  stage: Konva.Stage,
  deltaY: number,
  mapImage: Konva.Image | null,
) {
  const oldScale = stage.scaleX()
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null) return

  const scaleBy = 1.08
  const nextScale = deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
  const newScale = clamp(nextScale, minScale, Math.max(minScale, 4))
  const pointer = stage.getPointerPosition()
  if (!pointer) return

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }
  stage.scale({ x: newScale, y: newScale })
  stage.position({
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  })
  constrainStagePosition(stage, mapImage)
  stage.batchDraw()
}

export function applyStagePinchZoom(
  stage: Konva.Stage,
  touches: TouchList,
  pinchLastCenterRef: MutableRefObject<MapCanvasPoint | null>,
  pinchLastDistanceRef: MutableRefObject<number | null>,
  mapImage: Konva.Image | null,
) {
  if (touches.length < 2) return

  const touch1 = touches[0]
  const touch2 = touches[1]
  if (!touch1 || !touch2) return

  const center = getLocalPinchCenter(
    touches,
    stage.container().getBoundingClientRect(),
  )
  if (!center) return

  const distance = Math.hypot(
    touch2.clientX - touch1.clientX,
    touch2.clientY - touch1.clientY,
  )
  const previousCenter = pinchLastCenterRef.current
  const previousDistance = pinchLastDistanceRef.current
  if (!previousCenter || !previousDistance) {
    pinchLastCenterRef.current = center
    pinchLastDistanceRef.current = distance
    return
  }

  const oldScale = stage.scaleX()
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null) return

  const viewport = calculatePinchViewport({
    currentScale: oldScale,
    minScale,
    maxScale: Math.max(minScale, 4),
    position: stage.position(),
    previousCenter,
    center,
    previousDistance,
    distance,
  })
  stage.scale({ x: viewport.scale, y: viewport.scale })
  stage.position(viewport.position)
  constrainStagePosition(stage, mapImage)
  stage.batchDraw()
  pinchLastCenterRef.current = center
  pinchLastDistanceRef.current = distance
}

export function preserveStageViewOnResize(
  stage: Konva.Stage,
  mapImage: Konva.Image,
  previousWidth: number,
  previousHeight: number,
) {
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null) return

  const viewport = preserveViewportOnResize({
    previousWidth,
    previousHeight,
    nextWidth: stage.width(),
    nextHeight: stage.height(),
    currentScale: stage.scaleX(),
    minScale,
    position: { x: stage.x(), y: stage.y() },
  })
  stage.scale({ x: viewport.scale, y: viewport.scale })
  stage.position(viewport.position)
  constrainStagePosition(stage, mapImage)
}

export function getStageMinScale(
  stage: Konva.Stage,
  mapImage: Konva.Image | null,
) {
  if (!mapImage) return null

  const imageSource = mapImage.image()
  if (!imageSource) return null

  const imageSize = getCanvasImageSize(imageSource)
  if (!imageSize) return null

  return Math.min(
    stage.width() / imageSize.width,
    stage.height() / imageSize.height,
  )
}

export function constrainStagePosition(
  stage: Konva.Stage,
  mapImage: Konva.Image | null,
) {
  if (!mapImage) return

  const imageSource = mapImage.image()
  if (!imageSource) return

  const imageSize = getCanvasImageSize(imageSource)
  if (!imageSize) return

  const scaledWidth = imageSize.width * stage.scaleX()
  const scaledHeight = imageSize.height * stage.scaleY()
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const x =
    scaledWidth <= stageWidth
      ? (stageWidth - scaledWidth) / 2
      : clamp(stage.x(), stageWidth - scaledWidth, 0)
  const y =
    scaledHeight <= stageHeight
      ? (stageHeight - scaledHeight) / 2
      : clamp(stage.y(), stageHeight - scaledHeight, 0)

  stage.position({ x, y })
}

export function getContentPointerPosition(stage: Konva.Stage) {
  const pointer = stage.getPointerPosition()
  if (!pointer) return null

  const transform = stage.getAbsoluteTransform().copy()
  transform.invert()
  return transform.point(pointer)
}

export function fitImageToStage(stage: Konva.Stage, mapImage: Konva.Image) {
  const imageSource = mapImage.image()
  if (!imageSource) return

  const imageSize = getCanvasImageSize(imageSource)
  if (!imageSize) return

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const scale = Math.min(
    stageWidth / imageSize.width,
    stageHeight / imageSize.height,
  )
  mapImage.position({ x: 0, y: 0 })
  mapImage.size({ width: imageSize.width, height: imageSize.height })
  stage.scale({ x: scale, y: scale })
  stage.position({
    x: (stageWidth - imageSize.width * scale) / 2,
    y: (stageHeight - imageSize.height * scale) / 2,
  })
}

export function focusStageOnMarker(
  stage: Konva.Stage,
  mapImage: Konva.Image,
  marker: Pick<MapMarkerItem, "x" | "y">,
) {
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null) return

  const targetScale = clamp(
    Math.max(minScale * 1.85, minScale + 0.35),
    minScale,
    Math.max(minScale, 4),
  )
  stage.scale({ x: targetScale, y: targetScale })
  stage.position({
    x: stage.width() / 2 - marker.x * targetScale,
    y: stage.height() / 2 - marker.y * targetScale,
  })
  constrainStagePosition(stage, mapImage)
}

export function isMarkerVisibleInViewport(
  stage: Konva.Stage,
  marker: Pick<MapMarkerItem, "x" | "y" | "size" | "pinStyle">,
  label: string,
) {
  const scale = stage.scaleX()
  const screenX = stage.x() + marker.x * scale
  const screenY = stage.y() + marker.y * scale
  const size = clamp(marker.size ?? 1, 0.5, 2)
  const basePadding =
    marker.pinStyle === "label"
      ? Math.max(MARKER_VIEWPORT_PADDING, label.length * 10)
      : MARKER_VIEWPORT_PADDING
  const padding = basePadding * size

  return (
    screenX >= -padding &&
    screenX <= stage.width() + padding &&
    screenY >= -padding &&
    screenY <= stage.height() + padding
  )
}

export function getMarkerRenderMode(
  stage: Konva.Stage,
  mapImage: Konva.Image | null,
): MarkerRenderMode {
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null || minScale <= 0) return "full"

  const zoomRatio = stage.scaleX() / minScale
  if (zoomRatio < 1.35) return "dot"
  if (zoomRatio < 2.05) return "compact"
  return "full"
}

export function getPreferredPixelRatio() {
  if (typeof window === "undefined") return 1

  const devicePixelRatio = window.devicePixelRatio || 1
  const coarsePointer =
    window.matchMedia?.("(pointer: coarse)").matches ?? false
  return coarsePointer ? 1 : Math.min(devicePixelRatio, 1.5)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getCanvasImageSize(
  source: CanvasImageSource,
): { width: number; height: number } | null {
  if ("width" in source && "height" in source) {
    const width = Number(source.width)
    const height = Number(source.height)
    if (width > 0 && height > 0) return { width, height }
  }

  if ("videoWidth" in source && "videoHeight" in source) {
    const width = Number(source.videoWidth)
    const height = Number(source.videoHeight)
    if (width > 0 && height > 0) return { width, height }
  }

  return null
}
