import Konva from "konva"
import {
  applyStagePinchZoom,
  applyStageZoom,
  getContentPointerPosition,
  syncMapInteraction,
  type MapCanvasPoint
} from "./mapCanvasStage"

const TOUCH_TAP_MAX_MOVEMENT = 10
const SYNTHETIC_MOUSE_GUARD_MS = 500

export type MapCanvasGestureOptions = {
  isInteractive: boolean
  isFullscreen: boolean
  isBrushMode: boolean
  brushColor: string
  brushSize: number
  isMarkerSelectionMode: boolean
  isMarkerRepositionMode: boolean
  onAddPendingMarker: (pointer: MapCanvasPoint) => void
  onRepositionMarker: (pointer: MapCanvasPoint) => void
}

type BindMapCanvasGesturesParams = {
  stage: Konva.Stage
  getOptions: () => MapCanvasGestureOptions
  getMapImage: () => Konva.Image | null
  getDrawLayer: () => Konva.Layer | null
  onViewChange: () => void
}

export function canInteractMap(
  isInteractive: boolean,
  isFullscreen: boolean
) {
  return isInteractive && isFullscreen
}

export function bindMapCanvasGestures({
  stage,
  getOptions,
  getMapImage,
  getDrawLayer,
  onViewChange
}: BindMapCanvasGesturesParams) {
  let currentLine: Konva.Line | null = null
  let isDrawing = false
  let isPinching = false
  const pinchLastCenter = { current: null as MapCanvasPoint | null }
  const pinchLastDistance = { current: null as number | null }
  let touchSelectionStart: MapCanvasPoint | null = null
  let touchSelectionMoved = false
  let lastTouchInteractionAt = 0

  const syncInteraction = () => {
    const options = getOptions()
    syncMapInteraction(
      stage,
      options.isInteractive,
      options.isBrushMode,
      options.isFullscreen,
      options.isMarkerSelectionMode || options.isMarkerRepositionMode,
      isPinching
    )
  }

  const cancelDrawing = () => {
    isDrawing = false
    currentLine = null
  }

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    const options = getOptions()
    if (
      !canInteractMap(options.isInteractive, options.isFullscreen) ||
      options.isBrushMode
    ) {
      return
    }
    event.evt.preventDefault()
    applyStageZoom(stage, event.evt.deltaY, getMapImage())
    onViewChange()
  }

  const handleDrawStart = () => {
    if (Date.now() - lastTouchInteractionAt < SYNTHETIC_MOUSE_GUARD_MS) return

    const options = getOptions()
    const pointer = getContentPointerPosition(stage)
    if (options.isMarkerRepositionMode && pointer) {
      options.onRepositionMarker(pointer)
      return
    }
    if (options.isMarkerSelectionMode && pointer) {
      options.onAddPendingMarker(pointer)
      return
    }
    if (
      !canInteractMap(options.isInteractive, options.isFullscreen) ||
      !options.isBrushMode
    ) {
      return
    }

    const drawLayer = getDrawLayer()
    if (!drawLayer || !pointer) return
    isDrawing = true
    currentLine = new Konva.Line({
      points: [pointer.x, pointer.y],
      stroke: options.brushColor,
      strokeWidth: options.brushSize,
      lineCap: "round",
      lineJoin: "round"
    })
    drawLayer.add(currentLine)
  }

  const handleDrawMove = () => {
    const options = getOptions()
    if (
      !canInteractMap(options.isInteractive, options.isFullscreen) ||
      !options.isBrushMode ||
      !isDrawing
    ) {
      return
    }
    const pointer = getContentPointerPosition(stage)
    if (!currentLine || !pointer) return
    currentLine.points([...currentLine.points(), pointer.x, pointer.y])
    getDrawLayer()?.batchDraw()
  }

  const handleTouchStart = (event: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches
    if (touches.length >= 2) {
      isPinching = true
      syncInteraction()
      cancelDrawing()
      pinchLastCenter.current = null
      pinchLastDistance.current = null
      touchSelectionStart = null
      touchSelectionMoved = false
      return
    }

    const options = getOptions()
    if (options.isMarkerSelectionMode || options.isMarkerRepositionMode) {
      touchSelectionStart = getContentPointerPosition(stage)
      touchSelectionMoved = false
      lastTouchInteractionAt = Date.now()
      return
    }
    handleDrawStart()
  }

  const handleTouchMove = (event: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches
    const options = getOptions()
    if (touches.length >= 2) {
      if (!canInteractMap(options.isInteractive, options.isFullscreen)) return
      if (!isPinching) {
        isPinching = true
        syncInteraction()
        pinchLastCenter.current = null
        pinchLastDistance.current = null
      }
      event.evt.preventDefault()
      applyStagePinchZoom(
        stage,
        touches,
        pinchLastCenter,
        pinchLastDistance,
        getMapImage()
      )
      onViewChange()
      return
    }

    if (isPinching) {
      isPinching = false
      pinchLastCenter.current = null
      pinchLastDistance.current = null
      syncInteraction()
      return
    }

    if (options.isMarkerSelectionMode || options.isMarkerRepositionMode) {
      const pointer = getContentPointerPosition(stage)
      if (!touchSelectionStart || !pointer) return
      const distance = Math.hypot(
        pointer.x - touchSelectionStart.x,
        pointer.y - touchSelectionStart.y
      )
      if (distance > TOUCH_TAP_MAX_MOVEMENT) touchSelectionMoved = true
      lastTouchInteractionAt = Date.now()
      return
    }
    handleDrawMove()
  }

  const handleTouchEnd = (event: Konva.KonvaEventObject<TouchEvent>) => {
    const options = getOptions()
    const wasPinching = isPinching
    const shouldSelectMarker =
      (options.isMarkerSelectionMode || options.isMarkerRepositionMode) &&
      !isPinching &&
      Boolean(touchSelectionStart) &&
      !touchSelectionMoved

    if (shouldSelectMarker && touchSelectionStart) {
      if (options.isMarkerRepositionMode) {
        options.onRepositionMarker(touchSelectionStart)
      } else {
        options.onAddPendingMarker(touchSelectionStart)
      }
    }

    isPinching = false
    pinchLastCenter.current = null
    pinchLastDistance.current = null
    touchSelectionStart = null
    touchSelectionMoved = false
    lastTouchInteractionAt = Date.now()
    syncInteraction()
    if (wasPinching && event.evt.touches.length === 1 && stage.draggable()) {
      stage.startDrag(event)
    }
    cancelDrawing()
  }

  const handleDragMove = () => onViewChange()

  stage.on("wheel", handleWheel)
  stage.on("dragmove", handleDragMove)
  stage.on("mousedown", handleDrawStart)
  stage.on("mousemove", handleDrawMove)
  stage.on("mouseup mouseleave", cancelDrawing)
  stage.on("touchstart", handleTouchStart)
  stage.on("touchmove", handleTouchMove)
  stage.on("touchend touchcancel", handleTouchEnd)

  return {
    cancelDrawing,
    clearLastDrawing() {
      const drawLayer = getDrawLayer()
      if (!drawLayer) return
      const drawings = drawLayer.getChildren(
        (node) => node instanceof Konva.Line
      )
      drawings[drawings.length - 1]?.destroy()
      drawLayer.batchDraw()
    },
    isDrawing: () => isDrawing,
    isPinching: () => isPinching,
    dispose() {
      stage.off("wheel", handleWheel)
      stage.off("dragmove", handleDragMove)
      stage.off("mousedown", handleDrawStart)
      stage.off("mousemove", handleDrawMove)
      stage.off("mouseup mouseleave", cancelDrawing)
      stage.off("touchstart", handleTouchStart)
      stage.off("touchmove", handleTouchMove)
      stage.off("touchend touchcancel", handleTouchEnd)
      cancelDrawing()
    }
  }
}

export type MapCanvasGestureController = ReturnType<
  typeof bindMapCanvasGestures
>
