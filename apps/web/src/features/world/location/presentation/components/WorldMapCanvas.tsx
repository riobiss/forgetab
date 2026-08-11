"use client"

/* eslint-disable react-hooks/exhaustive-deps -- Konva callbacks read mutable refs to avoid re-registering canvas listeners on each render. */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import Konva from "konva"
import type {
  MapMarkerItem,
  MarkerGroup,
  PendingMarker
} from "@/features/world/location/presentation/types/mapMarkers"
import type { WorldMapCanvasHandle } from "@/features/world/location/presentation/types/worldMapCanvas"
import {
  bindMapCanvasGestures,
  canInteractMap,
  type MapCanvasGestureController,
  type MapCanvasGestureOptions
} from "@/features/world/location/presentation/utils/mapCanvasGestures"
import {
  redrawPendingMarkerLayer,
  redrawPersistedMarkerLayer
} from "@/features/world/location/presentation/utils/mapCanvasMarkerRenderer"
import {
  fitImageToStage,
  focusStageOnMarker,
  getPreferredPixelRatio,
  preserveStageViewOnResize,
  syncMapInteraction,
  type MapCanvasPoint
} from "@/features/world/location/presentation/utils/mapCanvasStage"
import styles from "../WorldMap.module.css"

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
  onAddPendingMarker: (pointer: MapCanvasPoint) => void
  onRepositionMarker: (pointer: MapCanvasPoint) => void
  onMarkerPinSelect: (marker: MapMarkerItem, groupColor: string) => void
  onEnableInteraction: () => void
  onMapSrcError: () => void
}

export const WorldMapCanvas = forwardRef<WorldMapCanvasHandle, Props>(
  function WorldMapCanvas(props, ref) {
    const {
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
      onMapSrcError
    } = props
    const stageContainerRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<Konva.Stage | null>(null)
    const mapLayerRef = useRef<Konva.Layer | null>(null)
    const mapImageRef = useRef<Konva.Image | null>(null)
    const markerLayerRef = useRef<Konva.Layer | null>(null)
    const markerOverlayLayerRef = useRef<Konva.Layer | null>(null)
    const drawLayerRef = useRef<Konva.Layer | null>(null)
    const gestureControllerRef = useRef<MapCanvasGestureController | null>(null)
    const markerRedrawFrameRef = useRef<number | null>(null)
    const overlayRedrawFrameRef = useRef<number | null>(null)
    const onMarkerPinSelectRef = useRef(onMarkerPinSelect)
    const onMapSrcErrorRef = useRef(onMapSrcError)
    const allMarkerGroupsRef = useRef(allMarkerGroups)
    const areMarkersVisibleRef = useRef(areMarkersVisible)
    const visibleMarkerGroupIdsRef = useRef(visibleMarkerGroupIds)
    const pendingMarkersRef = useRef(pendingMarkers)
    const editingMarkerPreviewRef = useRef(editingMarkerPreview)
    const markerGroupColorRef = useRef(markerGroupColor)
    const gestureOptionsRef = useRef<MapCanvasGestureOptions>({
      isInteractive,
      isFullscreen,
      isBrushMode,
      brushColor,
      brushSize,
      isMarkerSelectionMode,
      isMarkerRepositionMode,
      onAddPendingMarker,
      onRepositionMarker
    })
    gestureOptionsRef.current = {
      isInteractive,
      isFullscreen,
      isBrushMode,
      brushColor,
      brushSize,
      isMarkerSelectionMode,
      isMarkerRepositionMode,
      onAddPendingMarker,
      onRepositionMarker
    }

    function scheduleMarkerLayerRedraw() {
      if (markerRedrawFrameRef.current !== null) return
      markerRedrawFrameRef.current = requestAnimationFrame(() => {
        markerRedrawFrameRef.current = null
        const stage = stageRef.current
        const layer = markerLayerRef.current
        if (!stage || !layer) return
        redrawPersistedMarkerLayer({
          stage,
          layer,
          mapImage: mapImageRef.current,
          groups: allMarkerGroupsRef.current,
          visibleGroupIds: visibleMarkerGroupIdsRef.current,
          markersVisible: areMarkersVisibleRef.current,
          editingMarker: editingMarkerPreviewRef.current,
          markerSelectionMode: gestureOptionsRef.current.isMarkerSelectionMode,
          onSelect: onMarkerPinSelectRef.current
        })
      })
    }

    function scheduleOverlayLayerRedraw() {
      if (overlayRedrawFrameRef.current !== null) return
      overlayRedrawFrameRef.current = requestAnimationFrame(() => {
        overlayRedrawFrameRef.current = null
        const stage = stageRef.current
        const layer = markerOverlayLayerRef.current
        if (!stage || !layer) return
        redrawPendingMarkerLayer({
          stage,
          layer,
          mapImage: mapImageRef.current,
          pendingMarkers: pendingMarkersRef.current,
          editingMarker: editingMarkerPreviewRef.current,
          markerGroupColor: markerGroupColorRef.current,
          markerRepositionMode:
            gestureOptionsRef.current.isMarkerRepositionMode
        })
      })
    }

    function syncCanvasToContainer(shouldFitImage = true) {
      const stage = stageRef.current
      const container = stageContainerRef.current
      if (!stage || !container) return

      container.style.width = ""
      container.style.height = ""
      const bounds = container.getBoundingClientRect()
      stage.size({
        width: Math.max(1, Math.round(bounds.width || container.clientWidth)),
        height: Math.max(1, Math.round(bounds.height || container.clientHeight))
      })
      if (mapImageRef.current && shouldFitImage) {
        fitImageToStage(stage, mapImageRef.current)
      }
      scheduleMarkerLayerRedraw()
      scheduleOverlayLayerRedraw()
      stage.batchDraw()
    }

    useImperativeHandle(
      ref,
      () => ({
        syncToContainer: () => syncCanvasToContainer(true),
        resetView: () => syncCanvasToContainer(true),
        clearLastDrawing: () =>
          gestureControllerRef.current?.clearLastDrawing(),
        focusMarker(marker) {
          const stage = stageRef.current
          const mapImage = mapImageRef.current
          if (!stage || !mapImage) return
          focusStageOnMarker(stage, mapImage, marker)
          scheduleMarkerLayerRedraw()
          scheduleOverlayLayerRedraw()
          stage.batchDraw()
        }
      }),
      []
    )

    useEffect(() => {
      syncMapInteraction(
        stageRef.current,
        isInteractive,
        isBrushMode,
        isFullscreen,
        isMarkerSelectionMode || isMarkerRepositionMode,
        gestureControllerRef.current?.isPinching() ?? false
      )
      if (!isBrushMode) gestureControllerRef.current?.cancelDrawing()
    }, [
      isInteractive,
      isBrushMode,
      isFullscreen,
      isMarkerRepositionMode,
      isMarkerSelectionMode
    ])

    useEffect(() => {
      const stage = stageRef.current
      if (!stage || !mapImageRef.current) return
      requestAnimationFrame(() => {
        requestAnimationFrame(() => syncCanvasToContainer(true))
      })
    }, [isFullscreen])

    useEffect(() => {
      onMapSrcErrorRef.current = onMapSrcError
    }, [onMapSrcError])
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
      if (!container || stageRef.current) return
      container.style.width = ""
      container.style.height = ""
      Konva.pixelRatio = getPreferredPixelRatio()

      const stage = new Konva.Stage({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        draggable: false
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

      const onViewChange = () => {
        scheduleMarkerLayerRedraw()
        scheduleOverlayLayerRedraw()
      }
      const gestureController = bindMapCanvasGestures({
        stage,
        getOptions: () => gestureOptionsRef.current,
        getMapImage: () => mapImageRef.current,
        getDrawLayer: () => drawLayerRef.current,
        onViewChange
      })
      gestureControllerRef.current = gestureController

      const handleResize = () => {
        const currentImage = mapImageRef.current
        const previousWidth = stage.width()
        const previousHeight = stage.height()
        const bounds = container.getBoundingClientRect()
        container.style.width = ""
        container.style.height = ""
        stage.size({
          width: Math.max(1, Math.round(bounds.width || container.clientWidth)),
          height: Math.max(
            1,
            Math.round(bounds.height || container.clientHeight)
          )
        })
        if (!currentImage || gestureController.isDrawing()) return
        const options = gestureOptionsRef.current
        if (canInteractMap(options.isInteractive, options.isFullscreen)) {
          preserveStageViewOnResize(
            stage,
            currentImage,
            previousWidth,
            previousHeight
          )
        } else {
          fitImageToStage(stage, currentImage)
        }
        onViewChange()
        stage.batchDraw()
      }
      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(container)

      return () => {
        resizeObserver.disconnect()
        gestureController.dispose()
        gestureControllerRef.current = null
        stage.destroy()
        stageRef.current = null
        mapLayerRef.current = null
        mapImageRef.current = null
        markerLayerRef.current = null
        markerOverlayLayerRef.current = null
        drawLayerRef.current = null
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
      if (!stage || !mapLayer) return
      const imageObj = new window.Image()
      imageObj.src = mapSrc
      imageObj.onload = () => {
        mapImageRef.current?.destroy()
        const mapImage = new Konva.Image({
          image: imageObj,
          x: 0,
          y: 0,
          listening: false
        })
        mapImageRef.current = mapImage
        mapLayer.add(mapImage)
        fitImageToStage(stage, mapImage)
        scheduleMarkerLayerRedraw()
        scheduleOverlayLayerRedraw()
        mapLayer.draw()
      }
      imageObj.onerror = () => onMapSrcErrorRef.current()
    }, [mapSrc])

    useEffect(() => {
      scheduleMarkerLayerRedraw()
    }, [isMarkerSelectionMode, isMarkerRepositionMode])
    useEffect(() => {
      scheduleOverlayLayerRedraw()
    }, [isMarkerRepositionMode])

    return (
      <>
        <div ref={stageContainerRef} className={styles.stageContainer} />
        {!canInteractMap(isInteractive, isFullscreen) &&
        !isMarkerSelectionMode &&
        !isMarkerRepositionMode ? (
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
  }
)
