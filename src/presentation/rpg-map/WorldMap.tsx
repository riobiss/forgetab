"use client"

import { type ChangeEvent, type MutableRefObject, useEffect, useRef, useState } from "react"
import Konva from "konva"
import Image from "next/image"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "react-hot-toast"
import type { RpgMapMarkerGroupDto } from "@/application/rpgMap/types"
import { dismissToast } from "@/lib/toast"
import { useRpgMapImageActions } from "@/presentation/rpg-map/hooks/useRpgMapImageActions"
import { useMapMarkerGroups } from "@/presentation/rpg-map/hooks/useMapMarkerGroups"
import { drawMarkerPin, getMarkerDisplayLabel } from "@/presentation/rpg-map/utils/markerPins"
import styles from "./WorldMap.module.css"
import type { MapMarkerItem } from "./types/mapMarkers"

const DEFAULT_MAP_SRC = "/map/world-map.png"
const BRUSH_COLORS = ["#c4243b", "#ff7a18", "#f5e6c8", "#4f9cff", "#34c759"]
const MARKER_COLORS = ["#f97316", "#f5b33b", "#60a5fa", "#34d399", "#f472b6", "#a78bfa"]
const MAX_MARKER_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
const OVERLAPPING_MARKER_DISTANCE = 28

type MundiMapProps = {
  rpgId: string
  mapId: string
  canEditContent: boolean
  canManageImage: boolean
  initialMapSrc: string | null
  initialPublicMarkerGroups: RpgMapMarkerGroupDto[]
}

export function MundiMap({ rpgId, mapId, canEditContent, canManageImage, initialMapSrc, initialPublicMarkerGroups }: MundiMapProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const stageContainerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const markerImageInputRef = useRef<HTMLInputElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const mapLayerRef = useRef<Konva.Layer | null>(null)
  const mapImageRef = useRef<Konva.Image | null>(null)
  const markerLayerRef = useRef<Konva.Layer | null>(null)
  const drawLayerRef = useRef<Konva.Layer | null>(null)
  const currentLineRef = useRef<Konva.Line | null>(null)
  const isDrawingRef = useRef(false)
  const isBrushModeRef = useRef(false)
  const isMarkerSelectionModeRef = useRef(false)
  const brushColorRef = useRef(BRUSH_COLORS[0])
  const brushSizeRef = useRef(4)
  const isInteractiveRef = useRef(false)
  const isFullscreenRef = useRef(false)
  const isPinchingRef = useRef(false)
  const pinchLastCenterRef = useRef<{ x: number; y: number } | null>(null)
  const pinchLastDistanceRef = useRef<number | null>(null)
  const [mapSrc, setMapSrc] = useState(initialMapSrc || DEFAULT_MAP_SRC)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBrushMode, setIsBrushMode] = useState(false)
  const [isInteractive, setIsInteractive] = useState(false)
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0])
  const [brushSize, setBrushSize] = useState(4)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMarkersModalOpen, setIsMarkersModalOpen] = useState(false)
  const [isMarkerFinalizeModalOpen, setIsMarkerFinalizeModalOpen] = useState(false)
  const [isMarkerListModalOpen, setIsMarkerListModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedMapMarker, setSelectedMapMarker] = useState<{
    marker: MapMarkerItem
    groupColor: string
  } | null>(null)
  const [overlappingMarkers, setOverlappingMarkers] = useState<Array<{
    marker: MapMarkerItem
    groupColor: string
  }> | null>(null)
  const [markerImageTarget, setMarkerImageTarget] = useState<{ mode: "pending" | "editing"; markerId: string } | null>(null)
  const [isMarkerImageUploading, setIsMarkerImageUploading] = useState(false)
  const markersModalRef = useRef<HTMLElement | null>(null)
  const finalizeModalRef = useRef<HTMLElement | null>(null)
  const markerListModalRef = useRef<HTMLElement | null>(null)
  const markerEditModalRef = useRef<HTMLElement | null>(null)
  const imageModalRef = useRef<HTMLDivElement | null>(null)
  const markerSheetRef = useRef<HTMLDivElement | null>(null)
  const overlappingMarkersModalRef = useRef<HTMLDivElement | null>(null)

  const { isUploading, uploadMessage, handleMapFile, handleResetMapImage } =
    useRpgMapImageActions({
      rpgId,
      mapId,
      canManage: canManageImage,
      mapSrc,
      setMapSrc,
    })

  const {
    allMarkerGroups,
    areMarkersVisible,
    visibleMarkerGroupIds,
    selectedMarkerGroups,
    selectedMarkerGroup,
    selectedMarkerGroupId,
    selectedVisibility,
    isMarkerSelectionMode,
    pendingMarkers,
    markerGroupName,
    markerGroupColor,
    editingMarker,
    editingMarkerName,
    editingMarkerLocation,
    editingMarkerShortDescription,
    editingMarkerImage,
    editingMarkerColor,
    editingGroupName,
    editingGroupColor,
    setSelectedMarkerGroupId,
    setSelectedVisibility,
    setPendingMarkers,
    setMarkerGroupName,
    setMarkerGroupColor,
    setEditingMarker,
    setEditingMarkerName,
    setEditingMarkerLocation,
    setEditingMarkerShortDescription,
    setEditingMarkerImage,
    setEditingMarkerColor,
    setEditingGroupName,
    setEditingGroupColor,
    setAreMarkersVisible,
    setVisibleMarkerGroupIds,
    openMarkersModal,
    startMarkerSelection,
    cancelMarkerSelection,
    concludeMarkerSelection,
    saveMarkerGroup,
    openMarkerList,
    saveMarkerGroupChanges,
    publishSelectedMarkerGroup,
    deleteMarkerGroup,
    clearAllMarkers,
    toggleMarkerGroupVisibility,
    openMarkerEdit,
    saveMarkerEdit,
    deleteMarkerItem,
  } = useMapMarkerGroups({
    rpgId,
    mapId,
    markerColors: MARKER_COLORS,
    initialPublicMarkerGroups,
  })

  useEffect(() => {
    setMapSrc(initialMapSrc || DEFAULT_MAP_SRC)
  }, [initialMapSrc])

  useEffect(() => {
    if (!canEditContent) {
      setIsEditOpen(false)
    }
  }, [canEditContent])

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
      if (isMarkerSelectionModeRef.current) {
        const pointer = getContentPointerPosition(stage)
        if (!pointer) {
          return
        }

        setPendingMarkers((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            x: pointer.x,
            y: pointer.y,
            name: `Marcador ${current.length + 1}`,
            location: "",
            shortDescription: "",
            image: "",
          },
        ])
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
          isPinchingRef.current,
        )
        isDrawingRef.current = false
        currentLineRef.current = null
        pinchLastCenterRef.current = null
        pinchLastDistanceRef.current = null
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
          isPinchingRef.current,
        )
        return
      }

      handleDrawMove()
    }

    const handleTouchEnd = () => {
      isPinchingRef.current = false
      pinchLastCenterRef.current = null
      pinchLastDistanceRef.current = null
      syncInteraction(
        stage,
        isInteractiveRef.current,
        isBrushModeRef.current,
        isFullscreenRef.current,
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
  }, [canEditContent, canManageImage])

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
      if (mapSrc !== DEFAULT_MAP_SRC) {
        setMapSrc(DEFAULT_MAP_SRC)
      }
    }
  }, [mapSrc])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const frame = frameRef.current
      setIsFullscreen(Boolean(frame && document.fullscreenElement === frame))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    isInteractiveRef.current = isInteractive
    syncInteraction(
      stageRef.current,
      isInteractive,
      isBrushMode,
      isFullscreen,
      isPinchingRef.current,
    )
  }, [isInteractive, isBrushMode, isFullscreen])

  useEffect(() => {
    isBrushModeRef.current = isBrushMode
  }, [isBrushMode])

  useEffect(() => {
    isMarkerSelectionModeRef.current = isMarkerSelectionMode
  }, [isMarkerSelectionMode])

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
    if (isFullscreen) {
      return
    }

    setSelectedMapMarker(null)
    setOverlappingMarkers(null)
  }, [isFullscreen])

  useEffect(() => {
    const activeModal = editingMarker
      ? markerEditModalRef.current
      : overlappingMarkers
        ? overlappingMarkersModalRef.current
      : selectedMapMarker
        ? markerSheetRef.current
      : isImageModalOpen
        ? imageModalRef.current
      : isMarkerListModalOpen
        ? markerListModalRef.current
        : isMarkerFinalizeModalOpen
          ? finalizeModalRef.current
          : isMarkersModalOpen
            ? markersModalRef.current
            : null

    if (!activeModal) {
      return
    }

    const modalElement = activeModal
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ")

    const getFocusableElements = () =>
      Array.from(modalElement.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
      )

    const firstFocusable = getFocusableElements()[0] ?? modalElement
    queueMicrotask(() => {
      firstFocusable.focus()
    })

    function handleFocusIn(event: FocusEvent) {
      if (event.target instanceof HTMLElement && modalElement.contains(event.target)) {
        return
      }

      const firstElement = getFocusableElements()[0] ?? modalElement
      firstElement.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (editingMarker) {
          setEditingMarker(null)
        } else if (overlappingMarkers) {
          setOverlappingMarkers(null)
        } else if (selectedMapMarker) {
          setSelectedMapMarker(null)
        } else if (isImageModalOpen) {
          setIsImageModalOpen(false)
        } else if (isMarkerListModalOpen) {
          setIsMarkerListModalOpen(false)
        } else if (isMarkerFinalizeModalOpen) {
          setIsMarkerFinalizeModalOpen(false)
        } else if (isMarkersModalOpen) {
          setIsMarkersModalOpen(false)
        }
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        modalElement.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [editingMarker, isImageModalOpen, isMarkerFinalizeModalOpen, isMarkerListModalOpen, isMarkersModalOpen, overlappingMarkers, selectedMapMarker])

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
          drawMarkerPin({
            layer: markerLayer,
            x: marker.x,
            y: marker.y,
            color: marker.color || group.color,
            label: getMarkerDisplayLabel(marker.name, index + 1),
            opacity: 0.95,
            onClick: () => {
              if (isMarkerSelectionModeRef.current) {
                return
              }
              handleMarkerPinSelect(marker, marker.color || group.color)
            },
          })
        })
      }
    }

    pendingMarkers.forEach((marker, index) => {
      drawMarkerPin({
        layer: markerLayer,
        x: marker.x,
        y: marker.y,
        color: markerGroupColor,
        label: getMarkerDisplayLabel(marker.name, index + 1),
        opacity: 0.82,
        dashed: true,
      })
    })

    markerLayer.batchDraw()
  }, [allMarkerGroups, areMarkersVisible, markerGroupColor, pendingMarkers, visibleMarkerGroupIds])

  const handleEnableInteraction = () => {
    if (isFullscreen && !isInteractive) {
      setIsInteractive(true)
    }
  }

  const toggleFullscreen = async () => {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    if (document.fullscreenElement === frame) {
      await document.exitFullscreen()
      setIsBrushMode(false)
      return
    }

    await frame.requestFullscreen()
  }

  const resetView = () => {
    const stage = stageRef.current
    const mapImage = mapImageRef.current
    if (!stage || !mapImage) {
      return
    }

    fitImageToStage(stage, mapImage)
    stage.batchDraw()
  }

  const toggleBrushMode = () => {
    if (!isInteractive) {
      return
    }

    setIsBrushMode((prev) => {
      const next = !prev
      if (!next) {
        isDrawingRef.current = false
        currentLineRef.current = null
      }
      return next
    })
  }

  const clearLastDrawing = () => {
    const drawLayerCurrent = drawLayerRef.current
    if (!drawLayerCurrent) {
      return
    }

    const drawings = drawLayerCurrent.getChildren(
      (node) => node instanceof Konva.Line,
    )
    const lastDrawing = drawings[drawings.length - 1]
    if (!lastDrawing) {
      return
    }

    lastDrawing.destroy()
    drawLayerCurrent.batchDraw()
  }

  function handleOpenMarkersModal() {
    setAreMarkersVisible(true)
    openMarkersModal()
    setIsMarkersModalOpen(true)
  }

  function handleStartMarkerSelection() {
    setAreMarkersVisible(true)
    startMarkerSelection()
    setIsMarkersModalOpen(false)
    setIsMarkerFinalizeModalOpen(false)
    setIsMarkerListModalOpen(false)
    setEditingMarker(null)
  }

  function handleCancelMarkerSelection() {
    cancelMarkerSelection()
    setIsMarkerFinalizeModalOpen(false)
  }

  function handleConcludeMarkerSelection() {
    if (concludeMarkerSelection()) {
      setIsMarkerFinalizeModalOpen(true)
    }
  }

  function handleSaveMarkerGroup() {
    const result = saveMarkerGroup()
    if (result) {
      setIsMarkerFinalizeModalOpen(false)
    }
  }

  function handleDeleteMarkerGroup() {
    deleteMarkerGroup()
    setIsMarkerListModalOpen(false)
    setIsMarkersModalOpen(false)
  }

  function handleEditSelectedMarkerGroup() {
    if (openMarkerList()) {
      setIsMarkersModalOpen(false)
      setIsMarkerListModalOpen(true)
    }
  }

  const handleOpenFilePicker = () => {
    if (!canManageImage || isUploading) {
      return
    }

    fileInputRef.current?.click()
  }

  const handleMapFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    await handleMapFile(file ?? null)
  }

  function openMarkerImagePicker(target: { mode: "pending" | "editing"; markerId: string }) {
    setMarkerImageTarget(target)
    markerImageInputRef.current?.click()
  }

  async function uploadMarkerImage(file: File, oldUrl?: string | null) {
    const formData = new FormData()
    formData.append("file", file)
    if (oldUrl) {
      formData.append("oldUrl", oldUrl)
    }

    const response = await fetch("/api/uploads/marker-image", {
      method: "POST",
      body: formData,
    })

    const payload = (await response.json().catch(() => ({}))) as { url?: string; message?: string }
    if (!response.ok || !payload.url) {
      throw new Error(payload.message ?? "Erro ao enviar imagem do marcador.")
    }

    return payload.url
  }

  async function deleteMarkerImageByUrl(url: string) {
    const response = await fetch("/api/uploads/marker-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })

    const payload = (await response.json().catch(() => ({}))) as { message?: string }
    if (!response.ok) {
      throw new Error(payload.message ?? "Erro ao remover imagem do marcador.")
    }
  }

  async function handleMarkerImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file || !markerImageTarget) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem valida para o marcador.")
      return
    }

    if (file.size > MAX_MARKER_IMAGE_SIZE_BYTES) {
      toast.error("Imagem muito grande. Limite de 8MB.")
      return
    }

    setIsMarkerImageUploading(true)
    const loadingToastId = toast.loading("Enviando imagem do marcador...")

    try {
      if (markerImageTarget.mode === "pending") {
        const currentMarker = pendingMarkers.find((marker) => marker.id === markerImageTarget.markerId)
        const uploadedUrl = await uploadMarkerImage(file, currentMarker?.image || null)
        setPendingMarkers((current) =>
          current.map((marker) =>
            marker.id === markerImageTarget.markerId
              ? { ...marker, image: uploadedUrl }
              : marker,
          ),
        )
      } else {
        const uploadedUrl = await uploadMarkerImage(file, editingMarkerImage || null)
        setEditingMarkerImage(uploadedUrl)
      }

      toast.success("Imagem do marcador atualizada com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar imagem do marcador.")
    } finally {
      dismissToast(loadingToastId)
      setIsMarkerImageUploading(false)
      setMarkerImageTarget(null)
    }
  }

  async function handleDeleteMarkerImage(target: { mode: "pending" | "editing"; markerId: string }, imageUrl: string | null) {
    if (!imageUrl || isMarkerImageUploading) {
      return
    }

    setIsMarkerImageUploading(true)
    const loadingToastId = toast.loading("Removendo imagem do marcador...")

    try {
      await deleteMarkerImageByUrl(imageUrl)

      if (target.mode === "pending") {
        setPendingMarkers((current) =>
          current.map((marker) =>
            marker.id === target.markerId
              ? { ...marker, image: "" }
              : marker,
          ),
        )
      } else {
        setEditingMarkerImage("")
      }

      toast.success("Imagem do marcador removida com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover imagem do marcador.")
    } finally {
      dismissToast(loadingToastId)
      setIsMarkerImageUploading(false)
    }
  }

  function handleMarkerPinSelect(clickedMarker: MapMarkerItem, groupColor: string) {
    const visibleMarkers = allMarkerGroups
      .filter((group) => visibleMarkerGroupIds.includes(group.id))
      .flatMap((group) =>
        group.markers.map((marker) => ({
          marker,
          groupColor: marker.color || group.color,
        })),
      )

    const nearbyMarkers = visibleMarkers.filter(({ marker }) => {
      const distance = Math.hypot(marker.x - clickedMarker.x, marker.y - clickedMarker.y)
      return distance <= OVERLAPPING_MARKER_DISTANCE
    })

    if (nearbyMarkers.length > 1) {
      setSelectedMapMarker(null)
      setOverlappingMarkers(nearbyMarkers)
      return
    }

    setOverlappingMarkers(null)
    setSelectedMapMarker({
      marker: clickedMarker,
      groupColor,
    })
  }

  function handleEditSelectedMapMarker() {
    if (!selectedMapMarker) {
      return
    }

    const matchedGroup = allMarkerGroups.find((group) =>
      group.markers.some((marker) => marker.id === selectedMapMarker.marker.id),
    )

    if (!matchedGroup) {
      return
    }

    setSelectedVisibility(matchedGroup.visibility)
    setSelectedMarkerGroupId(matchedGroup.id)
    setEditingMarker(selectedMapMarker.marker)
    setEditingMarkerName(selectedMapMarker.marker.name)
    setEditingMarkerLocation(selectedMapMarker.marker.location ?? "")
    setEditingMarkerShortDescription(selectedMapMarker.marker.shortDescription ?? "")
    setEditingMarkerImage(selectedMapMarker.marker.image ?? "")
    setEditingMarkerColor(selectedMapMarker.marker.color || matchedGroup.color)
    setSelectedMapMarker(null)
  }

  return (
    <section className={styles.wrapper}>
      <div
        ref={frameRef}
        className={`${styles.frame} ${isFullscreen ? styles.frameFullscreen : ""}`}
      >
        {canEditContent && isFullscreen ? (
          <div className={styles.leftActions}>
            <button
              type="button"
              onClick={handleOpenMarkersModal}
              className={styles.editButton}
              aria-haspopup="dialog"
              aria-expanded={isMarkersModalOpen}
            >
              Marcadores
            </button>
          </div>
        ) : null}

        {canEditContent || canManageImage ? (
          <div className={styles.ownerActions}>
            {isFullscreen && canEditContent ? (
              <button
                type="button"
                onClick={() => setIsEditOpen((prev) => !prev)}
                className={styles.editButton}
                aria-expanded={isEditOpen}
                aria-label="Editar mapa"
              >
                Editar
              </button>
            ) : canManageImage ? (
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className={styles.editButton}
                aria-haspopup="dialog"
                aria-expanded={isImageModalOpen}
                aria-label="Editar imagem do mapa"
              >
                Editar imagem
              </button>
            ) : null}
            {isFullscreen && isEditOpen ? (
              <div className={styles.editPanel}>
                {canEditContent ? (
                  <>
                    <button
                      type="button"
                      onClick={toggleBrushMode}
                      className={`${styles.actionButton} ${styles.brushToggle} ${
                        isBrushMode ? styles.brushToggleActive : ""
                      }`}
                      aria-label={isBrushMode ? "Desativar modo pincel" : "Ativar modo pincel"}
                      disabled={!isInteractive}
                    >
                      <Image
                        src="/icons/drawIcon.svg"
                        alt="Pincel"
                        width={16}
                        height={16}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={clearLastDrawing}
                      className={`${styles.actionButton} ${styles.iconActionButton}`}
                      aria-label="Limpar desenho anterior"
                      title="Limpar desenho anterior"
                    >
                      <Image
                        src="/icons/drawBack.svg"
                        alt="Limpar desenho anterior"
                        width={16}
                        height={16}
                        className={styles.whiteIcon}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={resetView}
                      className={styles.actionButton}
                    >
                      Centralizar
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {isMarkerSelectionMode ? (
          <div className={styles.selectionModalWrap}>
            <div className={styles.selectionBanner}>
              <div>
                <strong>Criando marcadores</strong>
                <span>Clique no mapa para adicionar pinos e depois conclua. {pendingMarkers.length} ponto(s) marcado(s).</span>
              </div>
              <div className={styles.selectionActions}>
                <button type="button" onClick={() => setPendingMarkers([])} className={styles.actionButton} disabled={pendingMarkers.length === 0}>
                  Limpar
                </button>
                <button type="button" onClick={handleConcludeMarkerSelection} className={styles.actionButton} disabled={pendingMarkers.length === 0}>
                  Concluir
                </button>
                <button type="button" onClick={handleCancelMarkerSelection} className={styles.actionButton}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isFullscreen && isEditOpen && isBrushMode ? (
          <div className={styles.topControls}>
            <label className={styles.brushSizeControl}>
              Linha
              <input
                type="range"
                min={1}
                max={20}
                value={brushSize}
                onChange={(event) =>
                  setBrushSize(Number(event.currentTarget.value))
                }
              />
              <span>{brushSize}px</span>
            </label>
            <div
              className={styles.colorPicker}
              role="group"
              aria-label="Cores do pincel"
            >
              {BRUSH_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBrushColor(color)}
                  className={`${styles.colorOption} ${
                    brushColor === color ? styles.colorOptionActive : ""
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Cor ${color}`}
                  title={`Cor ${color}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div ref={stageContainerRef} className={styles.stageContainer} />

        {!canInteractMap(isInteractive, isFullscreen) && !isMarkerSelectionMode ? (
          <button
            type="button"
            onClick={handleEnableInteraction}
            className={styles.interactionOverlay}
            disabled={!isFullscreen}
          >
            {isFullscreen
              ? "Clique no mapa para ativar interacao"
              : "Abra o mapa completo para interagir"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={toggleFullscreen}
          className={styles.expandButton}
          aria-label={isFullscreen ? "Fechar mapa completo" : "Abrir mapa completo"}
          title={isFullscreen ? "Fechar" : "Abrir"}
        >
          <Image
            src={isFullscreen ? "/icons/closeImg.svg" : "/icons/openImg.svg"}
            alt={isFullscreen ? "Fechar" : "Abrir"}
            width={18}
            height={18}
          />
        </button>

        {isMarkersModalOpen ? (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Marcadores">
            <section ref={markersModalRef} className={styles.modal} tabIndex={-1}>
              <div className={styles.modalHeader}>
                <h2>Marcadores</h2>
                <div className={styles.modalHeaderActions}>
                  {canEditContent ? (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={handleStartMarkerSelection}
                      aria-label="Criar marcadores"
                      title="Criar marcadores"
                    >
                      <Plus size={16} />
                    </button>
                  ) : null}
                  <button type="button" className={styles.iconButton} onClick={() => setIsMarkersModalOpen(false)} aria-label="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className={styles.segmentedTabs}>
                <button
                  type="button"
                  className={`${styles.segmentedTab} ${selectedVisibility === "public" ? styles.segmentedTabActive : ""}`}
                  onClick={() => setSelectedVisibility("public")}
                >
                  Publicos
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedTab} ${selectedVisibility === "private" ? styles.segmentedTabActive : ""}`}
                  onClick={() => setSelectedVisibility("private")}
                >
                  Privados
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedTab} ${selectedVisibility === "active" ? styles.segmentedTabActive : ""}`}
                  onClick={() => setSelectedVisibility("active")}
                >
                  Ativos
                </button>
              </div>
              {selectedVisibility === "active" ? (
                <div className={styles.field}>
                  <span>Grupos visiveis no mapa</span>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => {
                        setAreMarkersVisible(true)
                        setVisibleMarkerGroupIds(allMarkerGroups.map((group) => group.id))
                      }}
                    >
                      Marcar todos
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setVisibleMarkerGroupIds([])}
                    >
                      Desmarcar todos
                    </button>
                  </div>
                  {allMarkerGroups.length > 0 ? (
                    <div className={styles.markerVisibilityList}>
                      {allMarkerGroups.map((group) => (
                        <label key={group.id} className={styles.markerVisibilityItem}>
                          <input
                            type="checkbox"
                            checked={visibleMarkerGroupIds.includes(group.id)}
                            onChange={() => toggleMarkerGroupVisibility(group.id)}
                          />
                          <span className={styles.markerVisibilityName}>{group.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.modalSubtle}>Nenhum grupo criado ainda.</p>
                  )}
                </div>
              ) : selectedMarkerGroups.length > 0 ? (
                <>
                  <label className={styles.field}>
                    <span>Tipo</span>
                    <select value={selectedMarkerGroupId} onChange={(event) => setSelectedMarkerGroupId(event.target.value)}>
                      <option value="">Selecione um grupo</option>
                      {selectedMarkerGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.modalActions}>
                    <button type="button" className={styles.secondaryButton} onClick={handleEditSelectedMarkerGroup} disabled={!selectedMarkerGroup}>
                      <Pencil size={16} />
                      <span>Editar</span>
                    </button>
                    <button type="button" className={styles.secondaryButton} onClick={clearAllMarkers}>
                      <span>Limpar</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.modalSubtle}>
                  {selectedVisibility === "public"
                    ? "Nenhum grupo publico criado ainda."
                    : selectedVisibility === "private"
                      ? "Nenhum grupo privado criado ainda."
                      : "Nenhum grupo criado ainda."}
                </p>
              )}
            </section>
          </div>
        ) : null}

        {isMarkerFinalizeModalOpen ? (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Concluir marcadores">
            <section ref={finalizeModalRef} className={styles.modal} tabIndex={-1}>
              <div className={styles.modalHeader}>
                <h2>Novo grupo de marcadores</h2>
                <button type="button" className={styles.iconButton} onClick={handleCancelMarkerSelection} aria-label="Fechar">
                  <X size={16} />
                </button>
              </div>
              <label className={styles.field}>
                <span>Nome</span>
                <input value={markerGroupName} onChange={(event) => setMarkerGroupName(event.target.value)} />
              </label>
              <div className={styles.field}>
                <span>Cor</span>
                <div className={styles.markerColorRow}>
                  {MARKER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setMarkerGroupColor(color)}
                      className={`${styles.colorOption} ${markerGroupColor === color ? styles.colorOptionActive : ""}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Cor ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.markerDraftList}>
                {pendingMarkers.map((marker, index) => (
                  <div key={marker.id} className={styles.markerDraftItem}>
                    <div className={styles.markerDraftHeader}>
                      <span className={styles.markerNumber}>{index + 1}</span>
                      <input
                        value={marker.name}
                        placeholder="Nome"
                        onChange={(event) =>
                          setPendingMarkers((current) =>
                            current.map((item) => (item.id === marker.id ? { ...item, name: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                    <div className={styles.markerDraftFields}>
                      <input
                        value={marker.location}
                        placeholder="Localizacao"
                        onChange={(event) =>
                          setPendingMarkers((current) =>
                            current.map((item) => (item.id === marker.id ? { ...item, location: event.target.value } : item)),
                          )
                        }
                      />
                      <div className={styles.markerImageField}>
                        {marker.image ? (
                          <img
                            src={marker.image.trim()}
                            alt={marker.name}
                            className={styles.markerImagePreview}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={styles.markerImagePlaceholder}>Sem imagem</div>
                        )}
                        <div className={styles.markerImageActions}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => openMarkerImagePicker({ mode: "pending", markerId: marker.id })}
                            disabled={isMarkerImageUploading}
                          >
                            {marker.image ? "Trocar imagem" : "Adicionar imagem"}
                          </button>
                          {marker.image ? (
                            <button
                              type="button"
                              className={styles.secondaryDangerButton}
                              onClick={() => handleDeleteMarkerImage({ mode: "pending", markerId: marker.id }, marker.image)}
                              disabled={isMarkerImageUploading}
                            >
                              Deletar imagem
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <textarea
                        value={marker.shortDescription}
                        placeholder="Descricao"
                        rows={3}
                        onChange={(event) =>
                          setPendingMarkers((current) =>
                            current.map((item) => (item.id === marker.id ? { ...item, shortDescription: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.primaryButton} onClick={handleSaveMarkerGroup} disabled={pendingMarkers.length === 0}>
                  Salvar
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleCancelMarkerSelection}>
                  Cancelar
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {isMarkerListModalOpen && selectedMarkerGroup ? (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Lista de marcadores">
            <section ref={markerListModalRef} className={styles.modal} tabIndex={-1}>
              <div className={styles.modalHeader}>
                <div>
                  <h2>{selectedMarkerGroup.name}</h2>
                  <p className={styles.modalSubtle}>{selectedMarkerGroup.markers.length} marcador(es)</p>
                </div>
                <button type="button" className={styles.iconButton} onClick={() => setIsMarkerListModalOpen(false)} aria-label="Fechar">
                  <X size={16} />
                </button>
              </div>
              <label className={styles.field}>
                <span>Nome do grupo</span>
                <input value={editingGroupName} onChange={(event) => setEditingGroupName(event.target.value)} />
              </label>
              <div className={styles.field}>
                <span>Cor do grupo</span>
                <div className={styles.markerColorRow}>
                  {MARKER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingGroupColor(color)}
                      className={`${styles.colorOption} ${editingGroupColor === color ? styles.colorOptionActive : ""}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Cor ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.markerList}>
                {selectedMarkerGroup.markers.length > 0 ? (
                  selectedMarkerGroup.markers.map((marker, index) => (
                    <article key={marker.id} className={styles.markerListItem}>
                      <div className={styles.markerListMain}>
                        <span
                          className={styles.markerSwatch}
                          style={{ backgroundColor: marker.color || selectedMarkerGroup.color }}
                        />
                        <div>
                          <strong>{marker.name}</strong>
                          <small>{marker.location || `Pino ${index + 1}`}</small>
                        </div>
                      </div>
                      <div className={styles.markerListActions}>
                        <button type="button" className={styles.iconButton} onClick={() => openMarkerEdit(marker)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className={styles.iconButtonDanger} onClick={() => deleteMarkerItem(marker.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className={styles.modalSubtle}>Nenhum marcador neste grupo.</p>
                )}
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.primaryButton} onClick={saveMarkerGroupChanges}>
                  Salvar grupo
                </button>
                <button type="button" className={styles.secondaryButton} onClick={clearAllMarkers}>
                  Limpar todos
                </button>
                {selectedMarkerGroup.visibility === "private" ? (
                  <button type="button" className={styles.secondaryButton} onClick={publishSelectedMarkerGroup}>
                    Tornar publico
                  </button>
                ) : null}
                <button type="button" className={styles.iconButtonDanger} onClick={handleDeleteMarkerGroup}>
                  <Trash2 size={14} />
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => setIsMarkerListModalOpen(false)}>
                  Fechar
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {editingMarker && selectedMarkerGroup ? (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Editar marcador">
            <section ref={markerEditModalRef} className={`${styles.modal} ${styles.markerEditModal}`} tabIndex={-1}>
              <div className={styles.modalHeader}>
                <h2>Editar marcador</h2>
                <button type="button" className={styles.iconButton} onClick={() => setEditingMarker(null)} aria-label="Fechar">
                  <X size={16} />
                </button>
              </div>
              <label className={styles.field}>
                <span>Nome</span>
                <input value={editingMarkerName} onChange={(event) => setEditingMarkerName(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Localizacao</span>
                <input value={editingMarkerLocation} onChange={(event) => setEditingMarkerLocation(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Imagem</span>
                <div className={styles.markerImageField}>
                  {editingMarkerImage ? (
                    <img
                      src={editingMarkerImage.trim()}
                      alt={editingMarkerName || "Marcador"}
                      className={styles.markerImagePreview}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={styles.markerImagePlaceholder}>Sem imagem</div>
                  )}
                  <div className={styles.markerImageActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => editingMarker && openMarkerImagePicker({ mode: "editing", markerId: editingMarker.id })}
                      disabled={isMarkerImageUploading || !editingMarker}
                    >
                      {editingMarkerImage ? "Trocar imagem" : "Adicionar imagem"}
                    </button>
                    {editingMarkerImage ? (
                      <button
                        type="button"
                        className={styles.secondaryDangerButton}
                        onClick={() => editingMarker && handleDeleteMarkerImage({ mode: "editing", markerId: editingMarker.id }, editingMarkerImage)}
                        disabled={isMarkerImageUploading || !editingMarker}
                      >
                        Deletar imagem
                      </button>
                    ) : null}
                  </div>
                </div>
              </label>
              <label className={styles.field}>
                <span>Descricao</span>
                <textarea
                  value={editingMarkerShortDescription}
                  rows={4}
                  onChange={(event) => setEditingMarkerShortDescription(event.target.value)}
                />
              </label>
              <div className={styles.field}>
                <span>Cor</span>
                <div className={styles.markerColorRow}>
                  {MARKER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingMarkerColor(color)}
                      className={`${styles.colorOption} ${editingMarkerColor === color ? styles.colorOptionActive : ""}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Cor ${color}`}
                    />
                  ))}
                  <label
                    className={`${styles.colorOption} ${styles.customColorOption} ${!MARKER_COLORS.includes(editingMarkerColor) ? styles.colorOptionActive : ""}`}
                    style={{ backgroundColor: editingMarkerColor }}
                    aria-label="Selecionar cor personalizada"
                    title="Selecionar cor personalizada"
                  >
                    <input
                      type="color"
                      value={editingMarkerColor}
                      onChange={(event) => setEditingMarkerColor(event.currentTarget.value)}
                      className={styles.customColorInput}
                    />
                  </label>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.primaryButton} onClick={saveMarkerEdit}>
                  Salvar
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => setEditingMarker(null)}>
                  Cancelar
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {overlappingMarkers ? (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Selecionar marcador">
            <section ref={overlappingMarkersModalRef} className={styles.modal} tabIndex={-1}>
              <div className={styles.modalHeader}>
                <div>
                  <h2>Selecionar marcador</h2>
                  <p className={styles.modalSubtle}>Existem varios marcadores nessa regiao. Escolha qual deseja visualizar.</p>
                </div>
                <button type="button" className={styles.iconButton} onClick={() => setOverlappingMarkers(null)} aria-label="Fechar selecao de marcador">
                  <X size={16} />
                </button>
              </div>
              <div className={styles.markerList}>
                {overlappingMarkers.map(({ marker, groupColor }, index) => (
                  <button
                    key={marker.id}
                    type="button"
                    className={styles.overlappingMarkerButton}
                    onClick={() => {
                      setOverlappingMarkers(null)
                      setSelectedMapMarker({ marker, groupColor })
                    }}
                  >
                    <div className={styles.markerListMain}>
                      <span className={styles.markerSwatch} style={{ backgroundColor: groupColor }} />
                      <div>
                        <strong>{marker.name}</strong>
                        <small>{marker.location || `Pino ${index + 1}`}</small>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setOverlappingMarkers(null)}>
                  Cancelar
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {selectedMapMarker ? (
          <div className={styles.bottomSheetOverlay} role="dialog" aria-modal="true" aria-label="Detalhes do marcador">
            <section ref={markerSheetRef} className={styles.bottomSheet} tabIndex={-1}>
              <div className={styles.bottomSheetHandle} />
              <div className={styles.bottomSheetHeader}>
                <button type="button" className={styles.iconButton} onClick={handleEditSelectedMapMarker} aria-label="Editar marcador">
                  <Pencil size={16} />
                </button>
                <button type="button" className={styles.iconButton} onClick={() => setSelectedMapMarker(null)} aria-label="Fechar detalhes do marcador">
                  <X size={16} />
                </button>
              </div>

              {selectedMapMarker.marker.image ? (
                <div className={styles.bottomSheetImageWrap}>
                  <img
                    src={selectedMapMarker.marker.image.trim()}
                    alt={selectedMapMarker.marker.name}
                    className={styles.bottomSheetImage}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}

              <div className={styles.bottomSheetContent}>
                <div className={styles.bottomSheetField}>
                  <span>Nome</span>
                  <strong>{selectedMapMarker.marker.name}</strong>
                </div>
                <div className={styles.bottomSheetField}>
                  <span>Localizacao</span>
                  <strong>{selectedMapMarker.marker.location || "Nao informada"}</strong>
                </div>
                <div className={styles.bottomSheetField}>
                  <span>Descricao</span>
                  <p>{selectedMapMarker.marker.shortDescription || "Sem descricao."}</p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <input
        ref={markerImageInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleMarkerImageChange}
      />

      {canManageImage ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleMapFileChange}
          />
          {uploadMessage ? (
            <p className={styles.statusText}>{uploadMessage}</p>
          ) : null}

          {isImageModalOpen ? (
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Editar imagem do mapa">
              <div className={styles.modal} ref={imageModalRef} tabIndex={-1}>
                <header className={styles.modalHeader}>
                  <div>
                    <h2>Editar imagem</h2>
                    <p className={styles.modalSubtle}>Envie, troque ou remova a imagem usada no mapa.</p>
                  </div>
                  <button type="button" className={styles.iconButton} onClick={() => setIsImageModalOpen(false)} aria-label="Fechar edicao de imagem">
                    <X size={16} />
                  </button>
                </header>

                <div className={styles.imageModalActions}>
                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    className={styles.primaryButton}
                    disabled={isUploading}
                  >
                    <span>
                      {isUploading
                        ? "Enviando..."
                        : mapSrc === DEFAULT_MAP_SRC
                          ? "Enviar imagem"
                          : "Trocar imagem"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMapImage}
                    className={styles.secondaryDangerButton}
                    disabled={isUploading || mapSrc === DEFAULT_MAP_SRC}
                  >
                    <span>Deletar imagem</span>
                  </button>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setIsImageModalOpen(false)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

    </section>
  )
}

function syncInteraction(
  stage: Konva.Stage | null,
  isInteractive: boolean,
  isBrushMode: boolean,
  isFullscreen: boolean,
  isPinching: boolean,
) {
  if (!stage) {
    return
  }

  stage.draggable(
    canInteractMap(isInteractive, isFullscreen) && !isBrushMode && !isPinching,
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
  const pointer = stage.getPointerPosition()
  if (!pointer) {
    return
  }

  const scaleBy = 1.05
  const direction = deltaY > 0 ? -1 : 1
  const newScale = clampScale(
    stage,
    mapImage,
    direction > 0 ? oldScale * scaleBy : oldScale / scaleBy,
  )

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
  pinchLastCenterRef: MutableRefObject<{ x: number; y: number } | null>,
  pinchLastDistanceRef: MutableRefObject<number | null>,
  mapImage: Konva.Image | null,
) {
  if (touches.length < 2) {
    return
  }

  const touchA = touches[0]
  const touchB = touches[1]
  const containerRect = stage.container().getBoundingClientRect()
  const center = {
    x: (touchA.clientX + touchB.clientX) / 2 - containerRect.left,
    y: (touchA.clientY + touchB.clientY) / 2 - containerRect.top,
  }
  const distance = Math.hypot(
    touchB.clientX - touchA.clientX,
    touchB.clientY - touchA.clientY,
  )

  if (!pinchLastCenterRef.current || !pinchLastDistanceRef.current) {
    pinchLastCenterRef.current = center
    pinchLastDistanceRef.current = distance
    return
  }

  const oldScale = stage.scaleX()
  const pointTo = {
    x: (center.x - stage.x()) / oldScale,
    y: (center.y - stage.y()) / oldScale,
  }

  const scaleRatio = distance / pinchLastDistanceRef.current
  const newScale = clampScale(stage, mapImage, oldScale * scaleRatio)

  const dx = center.x - pinchLastCenterRef.current.x
  const dy = center.y - pinchLastCenterRef.current.y

  stage.scale({ x: newScale, y: newScale })
  stage.position({
    x: center.x - pointTo.x * newScale + dx,
    y: center.y - pointTo.y * newScale + dy,
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

function clampScale(
  stage: Konva.Stage,
  mapImage: Konva.Image | null,
  scale: number,
) {
  const fitScale = getFitScale(stage, mapImage)
  const minScale = fitScale ?? 0.2
  const maxScale = 8
  return Math.max(minScale, Math.min(maxScale, scale))
}

function getFitScale(stage: Konva.Stage, mapImage: Konva.Image | null) {
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
