"use client"

/* eslint-disable react-hooks/exhaustive-deps -- Konva stage callbacks read mutable refs to avoid re-registering canvas listeners on each render. */

import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from "react"
import Konva from "konva"
import type { MapMarkerItem, MarkerGroup, PendingMarker } from "@/presentation/rpg-map/types/mapMarkers"
import { drawMarkerPin, getMarkerDisplayLabel, type MarkerRenderMode } from "@/presentation/rpg-map/utils/markerPins"
import styles from "../WorldMap.module.css"

type Point = { x: number; y: number }
const TOUCH_TAP_MAX_MOVEMENT = 10
const SYNTHETIC_MOUSE_GUARD_MS = 500
const MARKER_VIEWPORT_PADDING = 132

export type WorldMapCanvasHandle = {
  syncToContainer: () => void
  resetView: () => void
  clearLastDrawing: () => void
  focusMarker: (marker: Pick<MapMarkerItem, "x" | "y">) => void
}

type Props = {
  mapSrc: string
  isFullscreen: boolean
  isInteractive: boolean
  isBrushMode: boolean
  brushColor: string
  brushSize: number
  isMarkerSelectionMode: boolean
  isMarkerRepositionMode: boolean
  pendingMarkers: PendingMarker[]
  editingMarkerPreview: MapMarkerItem | null
  markerGroupColor: string
  allMarkerGroups: MarkerGroup[]
  areMarkersVisible: boolean
  visibleMarkerGroupIds: string[]
  onAddPendingMarker: (pointer: Point) => void
  onRepositionMarker: (pointer: Point) => void
  onMarkerPinSelect: (marker: MapMarkerItem, groupColor: string) => void
  onEnableInteraction: () => void
  onMapSrcError: () => void
}

export const WorldMapCanvas = forwardRef<WorldMapCanvasHandle, Props>(function WorldMapCanvas(
  {
    mapSrc,
    isFullscreen,
    isInteractive,
    isBrushMode,
    brushColor,
    brushSize,
    isMarkerSelectionMode,
    isMarkerRepositionMode,
    pendingMarkers,
    editingMarkerPreview,
    markerGroupColor,
    allMarkerGroups,
    areMarkersVisible,
    visibleMarkerGroupIds,
    onAddPendingMarker,
    onRepositionMarker,
    onMarkerPinSelect,
    onEnableInteraction,
    onMapSrcError,
  },
  ref,
) {
  const stageContainerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const mapLayerRef = useRef<Konva.Layer | null>(null)
  const mapImageRef = useRef<Konva.Image | null>(null)
  const markerLayerRef = useRef<Konva.Layer | null>(null)
  const markerOverlayLayerRef = useRef<Konva.Layer | null>(null)
  const drawLayerRef = useRef<Konva.Layer | null>(null)
  const currentLineRef = useRef<Konva.Line | null>(null)
  const isDrawingRef = useRef(false)
  const isPinchingRef = useRef(false)
  const pinchLastCenterRef = useRef<Point | null>(null)
  const pinchLastDistanceRef = useRef<number | null>(null)
  const isInteractiveRef = useRef(false)
  const isFullscreenRef = useRef(false)
  const isBrushModeRef = useRef(false)
  const isMarkerSelectionModeRef = useRef(false)
  const isMarkerRepositionModeRef = useRef(false)
  const brushColorRef = useRef(brushColor)
  const brushSizeRef = useRef(brushSize)
  const onAddPendingMarkerRef = useRef(onAddPendingMarker)
  const onRepositionMarkerRef = useRef(onRepositionMarker)
  const onMarkerPinSelectRef = useRef(onMarkerPinSelect)
  const onMapSrcErrorRef = useRef(onMapSrcError)
  const allMarkerGroupsRef = useRef(allMarkerGroups)
  const areMarkersVisibleRef = useRef(areMarkersVisible)
  const visibleMarkerGroupIdsRef = useRef(visibleMarkerGroupIds)
  const pendingMarkersRef = useRef(pendingMarkers)
  const editingMarkerPreviewRef = useRef(editingMarkerPreview)
  const markerGroupColorRef = useRef(markerGroupColor)
  const markerRedrawFrameRef = useRef<number | null>(null)
  const overlayRedrawFrameRef = useRef<number | null>(null)
  const touchSelectionStartRef = useRef<Point | null>(null)
  const touchSelectionMovedRef = useRef(false)
  const lastTouchInteractionAtRef = useRef(0)

  function syncCanvasToContainer(shouldFitImage = true) {
    const stage = stageRef.current
    const mapImage = mapImageRef.current
    const container = stageContainerRef.current
    if (!stage || !container) {
      return
    }

    container.style.width = ""
    container.style.height = ""

    const bounds = container.getBoundingClientRect()
    const width = Math.max(1, Math.round(bounds.width || container.clientWidth))
    const height = Math.max(1, Math.round(bounds.height || container.clientHeight))

    stage.size({ width, height })

    if (mapImage && shouldFitImage) {
      fitImageToStage(stage, mapImage)
    }

    scheduleMarkerLayerRedraw()
    scheduleOverlayLayerRedraw()
    stage.batchDraw()
  }

  useImperativeHandle(ref, () => ({
    syncToContainer() {
      syncCanvasToContainer(true)
    },
    resetView() {
      syncCanvasToContainer(true)
    },
    clearLastDrawing() {
      const drawLayerCurrent = drawLayerRef.current
      if (!drawLayerCurrent) {
        return
      }

      const drawings = drawLayerCurrent.getChildren((node) => node instanceof Konva.Line)
      const lastDrawing = drawings[drawings.length - 1]
      if (!lastDrawing) {
        return
      }

      lastDrawing.destroy()
      drawLayerCurrent.batchDraw()
    },
    focusMarker(marker) {
      const stage = stageRef.current
      const mapImage = mapImageRef.current
      if (!stage || !mapImage) {
        return
      }

      focusStageOnMarker(stage, mapImage, marker)
      scheduleMarkerLayerRedraw()
      scheduleOverlayLayerRedraw()
      stage.batchDraw()
    },
  }), [])

  useEffect(() => {
    isInteractiveRef.current = isInteractive
    syncInteraction(
      stageRef.current,
      isInteractive,
      isBrushMode,
      isFullscreen,
      isMarkerSelectionMode || isMarkerRepositionMode,
      isPinchingRef.current,
    )
  }, [isInteractive, isBrushMode, isFullscreen, isMarkerRepositionMode, isMarkerSelectionMode])

  useEffect(() => {
    isBrushModeRef.current = isBrushMode
    if (!isBrushMode) {
      isDrawingRef.current = false
      currentLineRef.current = null
    }
  }, [isBrushMode])

  useEffect(() => {
    isMarkerSelectionModeRef.current = isMarkerSelectionMode
  }, [isMarkerSelectionMode])

  useEffect(() => {
    isMarkerRepositionModeRef.current = isMarkerRepositionMode
  }, [isMarkerRepositionMode])

  useEffect(() => {
    brushColorRef.current = brushColor
  }, [brushColor])

  useEffect(() => {
    brushSizeRef.current = brushSize
  }, [brushSize])

  useEffect(() => {
    isFullscreenRef.current = isFullscreen
  }, [isFullscreen])

  useEffect(() => {
    const stage = stageRef.current
    const mapImage = mapImageRef.current
    if (!stage || !mapImage) {
      return
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncCanvasToContainer(true)
      })
    })
  }, [isFullscreen])

  useEffect(() => {
    onAddPendingMarkerRef.current = onAddPendingMarker
  }, [onAddPendingMarker])

  useEffect(() => {
    onMapSrcErrorRef.current = onMapSrcError
  }, [onMapSrcError])

  useEffect(() => {
    onRepositionMarkerRef.current = onRepositionMarker
  }, [onRepositionMarker])

  useEffect(() => {
    onMarkerPinSelectRef.current = onMarkerPinSelect
  }, [onMarkerPinSelect])

  useEffect(() => {
    allMarkerGroupsRef.current = allMarkerGroups
    scheduleMarkerLayerRedraw()
  }, [allMarkerGroups])

  useEffect(() => {
    areMarkersVisibleRef.current = areMarkersVisible
    scheduleMarkerLayerRedraw()
  }, [areMarkersVisible])

  useEffect(() => {
    visibleMarkerGroupIdsRef.current = visibleMarkerGroupIds
    scheduleMarkerLayerRedraw()
  }, [visibleMarkerGroupIds])

  useEffect(() => {
    pendingMarkersRef.current = pendingMarkers
    scheduleOverlayLayerRedraw()
  }, [pendingMarkers])

  useEffect(() => {
    editingMarkerPreviewRef.current = editingMarkerPreview
    scheduleMarkerLayerRedraw()
    scheduleOverlayLayerRedraw()
  }, [editingMarkerPreview])

  useEffect(() => {
    markerGroupColorRef.current = markerGroupColor
    scheduleOverlayLayerRedraw()
  }, [markerGroupColor])

  useEffect(() => {
    const container = stageContainerRef.current
    if (!container || stageRef.current) {
      return
    }

    container.style.width = ""
    container.style.height = ""

    Konva.pixelRatio = getPreferredPixelRatio()

    const stage = new Konva.Stage({
      container,
      width: container.clientWidth,
      height: container.clientHeight,
      draggable: false,
    })

    const mapLayer = new Konva.Layer()
    const markerLayer = new Konva.Layer()
    const markerOverlayLayer = new Konva.Layer()
    const drawLayer = new Konva.Layer()
    stage.add(mapLayer)
    stage.add(markerLayer)
    stage.add(markerOverlayLayer)
    stage.add(drawLayer)

    stageRef.current = stage
    mapLayerRef.current = mapLayer
    markerLayerRef.current = markerLayer
    markerOverlayLayerRef.current = markerOverlayLayer
    drawLayerRef.current = drawLayer
    syncCanvasToContainer(false)

    const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
      if (!canInteractMap(isInteractiveRef.current, isFullscreenRef.current) || isBrushModeRef.current) {
        return
      }

      event.evt.preventDefault()
      applyZoom(stage, event.evt.deltaY, mapImageRef.current)
      scheduleMarkerLayerRedraw()
      scheduleOverlayLayerRedraw()
    }

    const handleDrawStart = () => {
      if (Date.now() - lastTouchInteractionAtRef.current < SYNTHETIC_MOUSE_GUARD_MS) {
        return
      }

      if (isMarkerRepositionModeRef.current) {
        const pointer = getContentPointerPosition(stage)
        if (!pointer) {
          return
        }

        onRepositionMarkerRef.current(pointer)
        return
      }

      if (isMarkerSelectionModeRef.current) {
        const pointer = getContentPointerPosition(stage)
        if (!pointer) {
          return
        }

        onAddPendingMarkerRef.current(pointer)
        return
      }

      if (!canInteractMap(isInteractiveRef.current, isFullscreenRef.current) || !isBrushModeRef.current) {
        return
      }

      const drawLayerCurrent = drawLayerRef.current
      const pointer = getContentPointerPosition(stage)
      if (!drawLayerCurrent || !pointer) {
        return
      }

      isDrawingRef.current = true
      const newLine = new Konva.Line({
        points: [pointer.x, pointer.y],
        stroke: brushColorRef.current,
        strokeWidth: brushSizeRef.current,
        lineCap: "round",
        lineJoin: "round",
      })

      currentLineRef.current = newLine
      drawLayerCurrent.add(newLine)
    }

    const handleDrawMove = () => {
      if (
        !canInteractMap(isInteractiveRef.current, isFullscreenRef.current) ||
        !isBrushModeRef.current ||
        !isDrawingRef.current
      ) {
        return
      }

      const line = currentLineRef.current
      const pointer = getContentPointerPosition(stage)
      if (!line || !pointer) {
        return
      }

      line.points([...line.points(), pointer.x, pointer.y])
      drawLayerRef.current?.batchDraw()
    }

    const handleDrawEnd = () => {
      isDrawingRef.current = false
      currentLineRef.current = null
    }

    const handleTouchStart = (event: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = event.evt.touches
      if (touches.length >= 2) {
        isPinchingRef.current = true
        syncInteraction(
          stage,
          isInteractiveRef.current,
          isBrushModeRef.current,
          isFullscreenRef.current,
          isMarkerSelectionModeRef.current || isMarkerRepositionModeRef.current,
          isPinchingRef.current,
        )
        isDrawingRef.current = false
        currentLineRef.current = null
        pinchLastCenterRef.current = null
        pinchLastDistanceRef.current = null
        touchSelectionStartRef.current = null
        touchSelectionMovedRef.current = false
        return
      }

      if (isMarkerSelectionModeRef.current || isMarkerRepositionModeRef.current) {
        touchSelectionStartRef.current = getContentPointerPosition(stage)
        touchSelectionMovedRef.current = false
        lastTouchInteractionAtRef.current = Date.now()
        return
      }

      handleDrawStart()
    }

    const handleTouchMove = (event: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = event.evt.touches
      if (touches.length >= 2) {
        if (!canInteractMap(isInteractiveRef.current, isFullscreenRef.current)) {
          return
        }

        if (!isPinchingRef.current) {
          isPinchingRef.current = true
          syncInteraction(
            stage,
            isInteractiveRef.current,
            isBrushModeRef.current,
            isFullscreenRef.current,
            isMarkerSelectionModeRef.current || isMarkerRepositionModeRef.current,
            isPinchingRef.current,
          )
          pinchLastCenterRef.current = null
          pinchLastDistanceRef.current = null
        }

        event.evt.preventDefault()
        applyPinchZoom(
          stage,
          touches,
          pinchLastCenterRef,
          pinchLastDistanceRef,
          mapImageRef.current,
        )
        scheduleMarkerLayerRedraw()
        scheduleOverlayLayerRedraw()
        return
      }

      if (isPinchingRef.current) {
        isPinchingRef.current = false
        pinchLastCenterRef.current = null
        pinchLastDistanceRef.current = null
        syncInteraction(
          stage,
          isInteractiveRef.current,
          isBrushModeRef.current,
          isFullscreenRef.current,
          isMarkerSelectionModeRef.current || isMarkerRepositionModeRef.current,
          isPinchingRef.current,
        )
        return
      }

      if (isMarkerSelectionModeRef.current || isMarkerRepositionModeRef.current) {
        const start = touchSelectionStartRef.current
        const pointer = getContentPointerPosition(stage)
        if (!start || !pointer) {
          return
        }

        const distance = Math.hypot(pointer.x - start.x, pointer.y - start.y)
        if (distance > TOUCH_TAP_MAX_MOVEMENT) {
          touchSelectionMovedRef.current = true
        }
        lastTouchInteractionAtRef.current = Date.now()
        return
      }

      handleDrawMove()
    }

    const handleTouchEnd = () => {
      const touchSelectionStart = touchSelectionStartRef.current
      const shouldCreateMarker =
        (isMarkerSelectionModeRef.current || isMarkerRepositionModeRef.current) &&
        !isPinchingRef.current &&
        Boolean(touchSelectionStart) &&
        !touchSelectionMovedRef.current

      if (shouldCreateMarker && touchSelectionStart) {
        if (isMarkerRepositionModeRef.current) {
          onRepositionMarkerRef.current(touchSelectionStart)
        } else {
          onAddPendingMarkerRef.current(touchSelectionStart)
        }
      }

      isPinchingRef.current = false
      pinchLastCenterRef.current = null
      pinchLastDistanceRef.current = null
      touchSelectionStartRef.current = null
      touchSelectionMovedRef.current = false
      lastTouchInteractionAtRef.current = Date.now()
      syncInteraction(
        stage,
        isInteractiveRef.current,
        isBrushModeRef.current,
        isFullscreenRef.current,
        isMarkerSelectionModeRef.current || isMarkerRepositionModeRef.current,
        isPinchingRef.current,
      )
      handleDrawEnd()
    }

    const handleResize = () => {
      const currentContainer = stageContainerRef.current
      const currentStage = stageRef.current
      const currentImage = mapImageRef.current

      if (!currentContainer || !currentStage) {
        return
      }

      const previousWidth = currentStage.width()
      const previousHeight = currentStage.height()

      const bounds = currentContainer.getBoundingClientRect()
      const width = Math.max(1, Math.round(bounds.width || currentContainer.clientWidth))
      const height = Math.max(1, Math.round(bounds.height || currentContainer.clientHeight))

      currentContainer.style.width = ""
      currentContainer.style.height = ""
      currentStage.size({ width, height })

      if (currentImage && !isDrawingRef.current) {
        if (canInteractMap(isInteractiveRef.current, isFullscreenRef.current)) {
          keepViewOnResize(currentStage, previousWidth, previousHeight)
        } else {
          fitImageToStage(currentStage, currentImage)
        }
        scheduleMarkerLayerRedraw()
        scheduleOverlayLayerRedraw()
        currentStage.batchDraw()
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    stage.on("wheel", handleWheel)
    stage.on("dragmove", () => {
      scheduleMarkerLayerRedraw()
      scheduleOverlayLayerRedraw()
    })
    stage.on("mousedown", handleDrawStart)
    stage.on("mousemove", handleDrawMove)
    stage.on("mouseup mouseleave", handleDrawEnd)
    stage.on("touchstart", handleTouchStart)
    stage.on("touchmove", handleTouchMove)
    stage.on("touchend touchcancel", handleTouchEnd)

    return () => {
      resizeObserver.disconnect()
      stage.off("wheel", handleWheel)
      stage.off("dragmove")
      stage.off("mousedown", handleDrawStart)
      stage.off("mousemove", handleDrawMove)
      stage.off("mouseup mouseleave", handleDrawEnd)
      stage.off("touchstart", handleTouchStart)
      stage.off("touchmove", handleTouchMove)
      stage.off("touchend touchcancel", handleTouchEnd)
      stage.destroy()
      stageRef.current = null
      mapLayerRef.current = null
      mapImageRef.current = null
      markerLayerRef.current = null
      markerOverlayLayerRef.current = null
      drawLayerRef.current = null
      currentLineRef.current = null
      if (markerRedrawFrameRef.current !== null) {
        cancelAnimationFrame(markerRedrawFrameRef.current)
      }
      if (overlayRedrawFrameRef.current !== null) {
        cancelAnimationFrame(overlayRedrawFrameRef.current)
      }
      container.style.width = ""
      container.style.height = ""
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const mapLayer = mapLayerRef.current
    if (!stage || !mapLayer) {
      return
    }

    const imageObj = new window.Image()
    imageObj.src = mapSrc
    imageObj.onload = () => {
      const previousImage = mapImageRef.current
      if (previousImage) {
        previousImage.destroy()
      }

      const mapImage = new Konva.Image({
        image: imageObj,
        x: 0,
        y: 0,
        listening: false,
      })

      mapImageRef.current = mapImage
      mapLayer.add(mapImage)
      fitImageToStage(stage, mapImage)
      scheduleMarkerLayerRedraw()
      scheduleOverlayLayerRedraw()
      mapLayer.draw()
    }
    imageObj.onerror = () => {
      onMapSrcErrorRef.current()
    }
  }, [mapSrc])

  function scheduleMarkerLayerRedraw() {
    if (markerRedrawFrameRef.current !== null) {
      return
    }

    markerRedrawFrameRef.current = requestAnimationFrame(() => {
      markerRedrawFrameRef.current = null
      redrawMarkerLayer()
    })
  }

  function scheduleOverlayLayerRedraw() {
    if (overlayRedrawFrameRef.current !== null) {
      return
    }

    overlayRedrawFrameRef.current = requestAnimationFrame(() => {
      overlayRedrawFrameRef.current = null
      redrawMarkerOverlayLayer()
    })
  }

  function redrawMarkerLayer() {
    const stage = stageRef.current
    const markerLayer = markerLayerRef.current
    if (!stage || !markerLayer) {
      return
    }

    markerLayer.destroyChildren()
    const renderMode = getMarkerRenderMode(stage, mapImageRef.current)

    if (areMarkersVisibleRef.current) {
      const visibleGroupIds = new Set(visibleMarkerGroupIdsRef.current)

      for (const group of allMarkerGroupsRef.current) {
        if (!visibleGroupIds.has(group.id)) {
          continue
        }

        group.markers.forEach((marker, index) => {
          if (editingMarkerPreviewRef.current && marker.id === editingMarkerPreviewRef.current.id) {
            return
          }

          const color = marker.color || group.color
          const label = getMarkerDisplayLabel(marker.name, index + 1)
          if (!isMarkerVisibleInViewport(stage, marker, label)) {
            return
          }

          drawMarkerPin({
            layer: markerLayer,
            x: marker.x,
            y: marker.y,
            color,
            label,
            size: marker.size,
            pinStyle: marker.pinStyle,
            renderMode,
            opacity: 0.95,
            onClick: () => {
              if (isMarkerSelectionModeRef.current) {
                return
              }
              onMarkerPinSelectRef.current(marker, color)
            },
          })
        })
      }
    }

    markerLayer.batchDraw()
  }

  function redrawMarkerOverlayLayer() {
    const stage = stageRef.current
    const markerOverlayLayer = markerOverlayLayerRef.current
    if (!stage || !markerOverlayLayer) {
      return
    }

    markerOverlayLayer.destroyChildren()
    const renderMode = getMarkerRenderMode(stage, mapImageRef.current)

    const editingMarkerPreviewCurrent = editingMarkerPreviewRef.current
    if (editingMarkerPreviewCurrent) {
      drawMarkerPin({
        layer: markerOverlayLayer,
        x: editingMarkerPreviewCurrent.x,
        y: editingMarkerPreviewCurrent.y,
        color: editingMarkerPreviewCurrent.color || markerGroupColorRef.current,
        label: getMarkerDisplayLabel(editingMarkerPreviewCurrent.name, 1),
        size: editingMarkerPreviewCurrent.size,
        pinStyle: editingMarkerPreviewCurrent.pinStyle,
        renderMode,
        opacity: 0.95,
        dashed: isMarkerRepositionMode,
      })
    }

    pendingMarkersRef.current.forEach((marker, index) => {
      const label = getMarkerDisplayLabel(marker.name, index + 1)
      if (!isMarkerVisibleInViewport(stage, marker, label)) {
        return
      }

      drawMarkerPin({
        layer: markerOverlayLayer,
        x: marker.x,
        y: marker.y,
        color: markerGroupColorRef.current,
        label,
        size: marker.size,
        pinStyle: marker.pinStyle,
        renderMode,
        opacity: 0.82,
        dashed: true,
      })
    })

    markerOverlayLayer.batchDraw()
  }

  useEffect(() => {
    scheduleMarkerLayerRedraw()
  }, [isMarkerSelectionMode, isMarkerRepositionMode])

  useEffect(() => {
    scheduleOverlayLayerRedraw()
  }, [isMarkerRepositionMode])

  return (
    <>
      <div ref={stageContainerRef} className={styles.stageContainer} />

      {!canInteractMap(isInteractive, isFullscreen) && !isMarkerSelectionMode && !isMarkerRepositionMode ? (
        <button
          type="button"
          onClick={onEnableInteraction}
          className={styles.interactionOverlay}
          disabled={!isFullscreen}
        >
          {isFullscreen
            ? "Clique no mapa para ativar interacao"
            : "Abra o mapa completo para interagir"}
        </button>
      ) : null}
    </>
  )
})

function syncInteraction(
  stage: Konva.Stage | null,
  isInteractive: boolean,
  isBrushMode: boolean,
  isFullscreen: boolean,
  isMarkerSelectionMode: boolean,
  isPinching: boolean,
) {
  if (!stage) {
    return
  }

  stage.draggable(
    canInteractMap(isInteractive, isFullscreen) &&
      !isBrushMode &&
      !isMarkerSelectionMode &&
      !isPinching,
  )
}

function canInteractMap(isInteractive: boolean, isFullscreen: boolean) {
  return isInteractive && isFullscreen
}

function applyZoom(
  stage: Konva.Stage,
  deltaY: number,
  mapImage: Konva.Image | null,
) {
  const oldScale = stage.scaleX()
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null) {
    return
  }

  const scaleBy = 1.08
  const nextScale =
    deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
  const newScale = clamp(nextScale, minScale, Math.max(minScale, 4))

  const pointer = stage.getPointerPosition()
  if (!pointer) {
    return
  }

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

function applyPinchZoom(
  stage: Konva.Stage,
  touches: TouchList,
  pinchLastCenterRef: MutableRefObject<Point | null>,
  pinchLastDistanceRef: MutableRefObject<number | null>,
  mapImage: Konva.Image | null,
) {
  if (touches.length < 2) {
    return
  }

  const touch1 = touches[0]
  const touch2 = touches[1]
  if (!touch1 || !touch2) {
    return
  }

  const center = {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  }
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
  if (minScale === null) {
    return
  }

  const localPoint = {
    x: (center.x - stage.x()) / oldScale,
    y: (center.y - stage.y()) / oldScale,
  }

  const distanceScale = distance / previousDistance
  const nextScale = oldScale * distanceScale
  const newScale = clamp(nextScale, minScale, Math.max(minScale, 4))

  stage.scale({ x: newScale, y: newScale })

  const dx = center.x - previousCenter.x
  const dy = center.y - previousCenter.y
  stage.position({
    x: center.x - localPoint.x * newScale + dx,
    y: center.y - localPoint.y * newScale + dy,
  })
  constrainStagePosition(stage, mapImage)
  stage.batchDraw()

  pinchLastCenterRef.current = center
  pinchLastDistanceRef.current = distance
}

function keepViewOnResize(
  stage: Konva.Stage,
  previousWidth: number,
  previousHeight: number,
) {
  if (previousWidth <= 0 || previousHeight <= 0) {
    return
  }

  const currentScale = stage.scaleX()
  const previousCenter = {
    x: previousWidth / 2,
    y: previousHeight / 2,
  }
  const contentPoint = {
    x: (previousCenter.x - stage.x()) / currentScale,
    y: (previousCenter.y - stage.y()) / currentScale,
  }

  const nextCenter = {
    x: stage.width() / 2,
    y: stage.height() / 2,
  }
  stage.position({
    x: nextCenter.x - contentPoint.x * currentScale,
    y: nextCenter.y - contentPoint.y * currentScale,
  })
}

function getStageMinScale(stage: Konva.Stage, mapImage: Konva.Image | null) {
  if (!mapImage) {
    return null
  }

  const imageSource = mapImage.image()
  if (!imageSource) {
    return null
  }

  const imageSize = getImageSize(imageSource)
  if (!imageSize) {
    return null
  }

  const widthScale = stage.width() / imageSize.width
  const heightScale = stage.height() / imageSize.height
  return Math.min(widthScale, heightScale)
}

function constrainStagePosition(stage: Konva.Stage, mapImage: Konva.Image | null) {
  if (!mapImage) {
    return
  }

  const imageSource = mapImage.image()
  if (!imageSource) {
    return
  }

  const imageSize = getImageSize(imageSource)
  if (!imageSize) {
    return
  }

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getContentPointerPosition(stage: Konva.Stage) {
  const pointer = stage.getPointerPosition()
  if (!pointer) {
    return null
  }

  const transform = stage.getAbsoluteTransform().copy()
  transform.invert()
  return transform.point(pointer)
}

function fitImageToStage(stage: Konva.Stage, mapImage: Konva.Image) {
  const imageSource = mapImage.image()
  if (!imageSource) {
    return
  }

  const imageSize = getImageSize(imageSource)
  if (!imageSize) {
    return
  }

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const widthScale = stageWidth / imageSize.width
  const heightScale = stageHeight / imageSize.height
  const scale = Math.min(widthScale, heightScale)

  mapImage.position({ x: 0, y: 0 })
  mapImage.size({ width: imageSize.width, height: imageSize.height })

  stage.scale({ x: scale, y: scale })
  stage.position({
    x: (stageWidth - imageSize.width * scale) / 2,
    y: (stageHeight - imageSize.height * scale) / 2,
  })
}

function focusStageOnMarker(
  stage: Konva.Stage,
  mapImage: Konva.Image,
  marker: Pick<MapMarkerItem, "x" | "y">,
) {
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null) {
    return
  }

  const targetScale = clamp(Math.max(minScale * 1.85, minScale + 0.35), minScale, Math.max(minScale, 4))
  stage.scale({ x: targetScale, y: targetScale })
  stage.position({
    x: stage.width() / 2 - marker.x * targetScale,
    y: stage.height() / 2 - marker.y * targetScale,
  })
  constrainStagePosition(stage, mapImage)
}

function isMarkerVisibleInViewport(
  stage: Konva.Stage,
  marker: Pick<MapMarkerItem, "x" | "y" | "size" | "pinStyle">,
  label: string,
) {
  const scale = stage.scaleX()
  const screenX = stage.x() + marker.x * scale
  const screenY = stage.y() + marker.y * scale
  const size = Math.max(0.5, Math.min(2, marker.size ?? 1))
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

function getMarkerRenderMode(
  stage: Konva.Stage,
  mapImage: Konva.Image | null,
): MarkerRenderMode {
  const minScale = getStageMinScale(stage, mapImage)
  if (minScale === null || minScale <= 0) {
    return "full"
  }

  const zoomRatio = stage.scaleX() / minScale
  if (zoomRatio < 1.35) {
    return "dot"
  }
  if (zoomRatio < 2.05) {
    return "compact"
  }
  return "full"
}

function getPreferredPixelRatio() {
  if (typeof window === "undefined") {
    return 1
  }

  const devicePixelRatio = window.devicePixelRatio || 1
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false
  return coarsePointer ? 1 : Math.min(devicePixelRatio, 1.5)
}

function getImageSize(
  source: CanvasImageSource,
): { width: number; height: number } | null {
  if ("width" in source && "height" in source) {
    const width = Number(source.width)
    const height = Number(source.height)
    if (width > 0 && height > 0) {
      return { width, height }
    }
  }

  if ("videoWidth" in source && "videoHeight" in source) {
    const width = Number(source.videoWidth)
    const height = Number(source.videoHeight)
    if (width > 0 && height > 0) {
      return { width, height }
    }
  }

  return null
}
