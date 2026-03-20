"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from "react"
import Konva from "konva"
import type { MapMarkerItem, MarkerGroup, PendingMarker } from "@/presentation/rpg-map/types/mapMarkers"
import { drawMarkerPin, getMarkerDisplayLabel } from "@/presentation/rpg-map/utils/markerPins"
import styles from "../WorldMap.module.css"

type Point = { x: number; y: number }
const TOUCH_TAP_MAX_MOVEMENT = 10
const SYNTHETIC_MOUSE_GUARD_MS = 500

export type WorldMapCanvasHandle = {
  resetView: () => void
  clearLastDrawing: () => void
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
  const onMapSrcErrorRef = useRef(onMapSrcError)
  const touchSelectionStartRef = useRef<Point | null>(null)
  const touchSelectionMovedRef = useRef(false)
  const lastTouchInteractionAtRef = useRef(0)

  useImperativeHandle(ref, () => ({
    resetView() {
      const stage = stageRef.current
      const mapImage = mapImageRef.current
      if (!stage || !mapImage) {
        return
      }

      fitImageToStage(stage, mapImage)
      stage.batchDraw()
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

    if (!isFullscreen) {
      const syncBackToInlineSize = () => {
        const currentStage = stageRef.current
        const currentImage = mapImageRef.current
        const currentContainer = stageContainerRef.current
        if (!currentStage || !currentImage || !currentContainer) {
          return
        }

        currentStage.size({
          width: currentContainer.clientWidth,
          height: currentContainer.clientHeight,
        })
        fitImageToStage(currentStage, currentImage)
        currentStage.batchDraw()
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(syncBackToInlineSize)
      })
    }
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
    const container = stageContainerRef.current
    if (!container || stageRef.current) {
      return
    }

    const stage = new Konva.Stage({
      container,
      width: container.clientWidth,
      height: container.clientHeight,
      draggable: false,
    })

    const mapLayer = new Konva.Layer()
    const markerLayer = new Konva.Layer()
    const drawLayer = new Konva.Layer()
    stage.add(mapLayer)
    stage.add(markerLayer)
    stage.add(drawLayer)

    stageRef.current = stage
    mapLayerRef.current = mapLayer
    markerLayerRef.current = markerLayer
    drawLayerRef.current = drawLayer

    const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
      if (!canInteractMap(isInteractiveRef.current, isFullscreenRef.current) || isBrushModeRef.current) {
        return
      }

      event.evt.preventDefault()
      applyZoom(stage, event.evt.deltaY, mapImageRef.current)
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

      currentStage.size({
        width: currentContainer.clientWidth,
        height: currentContainer.clientHeight,
      })

      if (currentImage && !isDrawingRef.current) {
        if (canInteractMap(isInteractiveRef.current, isFullscreenRef.current)) {
          keepViewOnResize(currentStage, previousWidth, previousHeight)
        } else {
          fitImageToStage(currentStage, currentImage)
        }
        currentStage.batchDraw()
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    stage.on("wheel", handleWheel)
    stage.on("mousedown", handleDrawStart)
    stage.on("mousemove", handleDrawMove)
    stage.on("mouseup mouseleave", handleDrawEnd)
    stage.on("touchstart", handleTouchStart)
    stage.on("touchmove", handleTouchMove)
    stage.on("touchend touchcancel", handleTouchEnd)

    return () => {
      resizeObserver.disconnect()
      stage.off("wheel", handleWheel)
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
      drawLayerRef.current = null
      currentLineRef.current = null
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
      mapLayer.draw()
    }
    imageObj.onerror = () => {
      onMapSrcErrorRef.current()
    }
  }, [mapSrc])

  useEffect(() => {
    const markerLayer = markerLayerRef.current
    if (!markerLayer) {
      return
    }

    markerLayer.destroyChildren()

    if (areMarkersVisible) {
      for (const group of allMarkerGroups) {
        if (!visibleMarkerGroupIds.includes(group.id)) {
          continue
        }
        group.markers.forEach((marker, index) => {
          if (editingMarkerPreview && marker.id === editingMarkerPreview.id) {
            return
          }

          drawMarkerPin({
            layer: markerLayer,
            x: marker.x,
            y: marker.y,
            color: marker.color || group.color,
            label: getMarkerDisplayLabel(marker.name, index + 1),
            size: marker.size,
            pinStyle: marker.pinStyle,
            opacity: 0.95,
            onClick: () => {
              if (isMarkerSelectionModeRef.current) {
                return
              }
              onMarkerPinSelect(marker, marker.color || group.color)
            },
          })
        })
      }
    }

    if (editingMarkerPreview) {
      drawMarkerPin({
        layer: markerLayer,
        x: editingMarkerPreview.x,
        y: editingMarkerPreview.y,
        color: editingMarkerPreview.color || markerGroupColor,
        label: getMarkerDisplayLabel(editingMarkerPreview.name, 1),
        size: editingMarkerPreview.size,
        pinStyle: editingMarkerPreview.pinStyle,
        opacity: 0.95,
        dashed: isMarkerRepositionMode,
      })
    }

    pendingMarkers.forEach((marker, index) => {
      drawMarkerPin({
        layer: markerLayer,
        x: marker.x,
        y: marker.y,
        color: markerGroupColor,
        label: getMarkerDisplayLabel(marker.name, index + 1),
        size: marker.size,
        pinStyle: marker.pinStyle,
        opacity: 0.82,
        dashed: true,
      })
    })

    markerLayer.batchDraw()
  }, [allMarkerGroups, areMarkersVisible, editingMarkerPreview, isMarkerRepositionMode, markerGroupColor, onMarkerPinSelect, pendingMarkers, visibleMarkerGroupIds])

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
