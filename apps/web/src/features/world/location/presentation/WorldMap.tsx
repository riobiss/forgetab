"use client"

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import type { RpgMapMarkerGroupDto } from "@forgetab/world-contracts/location"
import { MapInteractionBanner } from "@/features/world/location/presentation/components/MapInteractionBanner"
import { MapImageModal } from "@/features/world/location/presentation/components/MapImageModal"
import { WorldMapEditControls } from "@/features/world/location/presentation/components/WorldMapEditControls"
import { WorldMapCanvas } from "@/features/world/location/presentation/components/WorldMapCanvas"
import { WorldMapMarkerModals } from "@/features/world/location/presentation/components/WorldMapMarkerModals"
import type { WorldMapCanvasHandle } from "@/features/world/location/presentation/types/worldMapCanvas"
import { useMarkerImageActions } from "@/features/world/location/presentation/hooks/useMarkerImageActions"
import { useRpgMapImageActions } from "@/features/world/location/presentation/hooks/useRpgMapImageActions"
import { useMapMarkerGroups } from "@/features/world/location/presentation/hooks/useMapMarkerGroups"
import { useWorldMapMarkerModalFlow } from "@/features/world/location/presentation/hooks/useWorldMapMarkerModalFlow"
import { useWorldMapMarkerSelection } from "@/features/world/location/presentation/hooks/useWorldMapMarkerSelection"
import { useModalFocusTrap } from "@/shared/presentation/hooks/useModalFocusTrap"
import {
  DEFAULT_BRUSH_COLORS,
  useWorldMapUiState
} from "@/features/world/location/presentation/hooks/useWorldMapUiState"
import { buildDisplayMarkerGroups } from "@/features/world/location/presentation/utils/markerDisplay"
import styles from "./WorldMap.module.css"
import type { LinkedSectionSnapshot } from "./types/mapMarkers"

const DEFAULT_MAP_SRC = "/map/world-map.png"
const MARKER_COLORS = [
  "#f97316",
  "#f5b33b",
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#a78bfa"
]
const DEFAULT_MARKER_SIZE = 1
const OVERLAPPING_MARKER_DISTANCE = 28

type MundiMapProps = {
  rpgId: string
  mapId: string
  canEditContent: boolean
  canManageImage: boolean
  canManagePublicMarkers: boolean
  initialMapSrc: string | null
  initialPublicMarkerGroups: RpgMapMarkerGroupDto[]
  linkedSections?: LinkedSectionSnapshot[]
  sectionOptions?: Array<{ id: string; name: string }>
  focusMarkerRequest?: { markerId: string; token: number } | null
  onOpenLinkedSection?: (sectionId: string) => void
  onSaveMarkerSectionLink?: (
    markerId: string,
    sectionId: string | null
  ) => Promise<void> | void
}

export function MundiMap({
  rpgId,
  mapId,
  canEditContent,
  canManageImage,
  canManagePublicMarkers,
  initialMapSrc,
  initialPublicMarkerGroups,
  linkedSections = [],
  sectionOptions = [],
  focusMarkerRequest = null,
  onOpenLinkedSection,
  onSaveMarkerSectionLink
}: MundiMapProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<WorldMapCanvasHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mapSrc, setMapSrc] = useState(initialMapSrc || DEFAULT_MAP_SRC)
  const imageModalRef = useRef<HTMLDivElement | null>(null)

  const markerGroups = useMapMarkerGroups({
    rpgId,
    mapId,
    markerColors: MARKER_COLORS,
    initialPublicMarkerGroups
  })
  const {
    brushColor,
    brushSize,
    isBrushMode,
    isEditOpen,
    isFullscreen,
    isInteractive,
    setBrushColor,
    setBrushSize,
    setIsEditOpen,
    setIsInteractive,
    toggleBrushMode,
    toggleFullscreen,
    handleEnableInteraction,
    resetView,
    clearLastDrawing
  } = useWorldMapUiState({
    frameRef,
    canvasRef,
    canEditContent
  })

  const { isUploading, uploadMessage, handleMapFile, handleResetMapImage } =
    useRpgMapImageActions({
      rpgId,
      mapId,
      canManage: canManageImage,
      mapSrc,
      setMapSrc
    })

  const {
    allMarkerGroups,
    areMarkersVisible,
    visibleMarkerGroupIds,
    isMarkerSelectionMode,
    pendingMarkers,
    markerGroupColor,
    editingMarker,
    editingMarkerName,
    editingMarkerImage,
    editingMarkerColor,
    editingMarkerSize,
    editingMarkerPinStyle,
    setPendingMarkers,
    setEditingMarker,
    setEditingMarkerImage,
    setAreMarkersVisible,
    setVisibleMarkerGroupIds,
    setEditingMarkerPosition,
    openMarkersModal,
    startMarkerSelection,
    cancelMarkerSelection,
    concludeMarkerSelection,
    saveMarkerGroup,
    openMarkerList,
    deleteMarkerGroup
  } = markerGroups

  const displayMarkerGroups = useMemo(() => {
    return buildDisplayMarkerGroups(allMarkerGroups, linkedSections)
  }, [allMarkerGroups, linkedSections])

  const modalFlow = useWorldMapMarkerModalFlow({
    openMarkersModal,
    startMarkerSelection,
    cancelMarkerSelection,
    concludeMarkerSelection,
    saveMarkerGroup,
    openMarkerList,
    deleteMarkerGroup,
    setAreMarkersVisible,
    setEditingMarker,
    setEditingMarkerPosition
  })
  const {
    isImageModalOpen,
    isMarkerRepositionMode,
    isMarkersModalOpen,
    pendingMarkerReposition,
    setIsImageModalOpen,
    setIsMarkerRepositionMode,
    closeTransientUi,
    handleCancelMarkerReposition,
    handleCancelMarkerSelection,
    handleConfirmMarkerReposition,
    handleConcludeMarkerSelection,
    handleMarkerReposition,
    handleOpenMarkersModal
  } = modalFlow

  const selection = useWorldMapMarkerSelection({
    displayMarkerGroups,
    allMarkerGroups,
    visibleMarkerGroupIds,
    focusMarkerRequest,
    overlapDistance: OVERLAPPING_MARKER_DISTANCE,
    frameRef,
    canvasRef,
    setAreMarkersVisible,
    setVisibleMarkerGroupIds,
    closeTransientUi,
    setIsInteractive
  })
  const {
    setSelectedMapMarker,
    setOverlappingMarkers,
    handleMarkerPinSelect
  } = selection

  const markerImageActions = useMarkerImageActions({
    resolveOldImage(target) {
      if (target.mode === "pending") {
        return (
          pendingMarkers.find((marker) => marker.id === target.markerId)
            ?.image ?? null
        )
      }
      return editingMarkerImage || null
    },
    applyUploadedImage(target, url) {
      if (target.mode === "pending") {
        setPendingMarkers((current) =>
          current.map((marker) =>
            marker.id === target.markerId ? { ...marker, image: url } : marker
          )
        )
        return
      }
      setEditingMarkerImage(url)
    },
    applyRemovedImage(target) {
      if (target.mode === "pending") {
        setPendingMarkers((current) =>
          current.map((marker) =>
            marker.id === target.markerId ? { ...marker, image: "" } : marker
          )
        )
        return
      }
      setEditingMarkerImage("")
    }
  })
  useEffect(() => {
    setMapSrc(initialMapSrc || DEFAULT_MAP_SRC)
  }, [initialMapSrc])

  useEffect(() => {
    if (isFullscreen) {
      return
    }

    setSelectedMapMarker(null)
    setOverlappingMarkers(null)
    setIsMarkerRepositionMode(false)
  }, [
    isFullscreen,
    setIsMarkerRepositionMode,
    setOverlappingMarkers,
    setSelectedMapMarker
  ])

  useModalFocusTrap({
    isActive: isImageModalOpen,
    activeElement: imageModalRef.current,
    onEscape: () => setIsImageModalOpen(false)
  })

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

  function handleMapSrcError() {
    if (mapSrc !== DEFAULT_MAP_SRC) {
      setMapSrc(DEFAULT_MAP_SRC)
    }
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

        <WorldMapEditControls
          canEditContent={canEditContent}
          canManageImage={canManageImage}
          isFullscreen={isFullscreen}
          isEditOpen={isEditOpen}
          isImageModalOpen={isImageModalOpen}
          isBrushMode={isBrushMode}
          isInteractive={isInteractive}
          brushColor={brushColor}
          brushSize={brushSize}
          brushColors={DEFAULT_BRUSH_COLORS}
          onToggleEdit={() => setIsEditOpen((current) => !current)}
          onOpenImageModal={() => setIsImageModalOpen(true)}
          onToggleBrushMode={toggleBrushMode}
          onClearLastDrawing={clearLastDrawing}
          onResetView={resetView}
          onChangeBrushSize={setBrushSize}
          onChangeBrushColor={setBrushColor}
        />

        {isMarkerSelectionMode ? (
          <MapInteractionBanner
            title="Criando marcadores"
            description={`Clique no mapa para adicionar pinos e depois conclua. ${pendingMarkers.length} ponto(s) marcado(s).`}
            actions={[
              {
                key: "clear",
                label: "Limpar",
                onClick: () => setPendingMarkers([]),
                disabled: pendingMarkers.length === 0
              },
              {
                key: "finish",
                label: "Concluir",
                onClick: handleConcludeMarkerSelection,
                disabled: pendingMarkers.length === 0
              },
              {
                key: "cancel",
                label: "Cancelar",
                onClick: handleCancelMarkerSelection
              }
            ]}
          />
        ) : null}

        {isMarkerRepositionMode && editingMarker ? (
          <MapInteractionBanner
            title="Reposicionando marcador"
            description={`Clique no mapa para definir a nova posicao de ${editingMarkerName || "Marcador"} e confirme para aplicar.`}
            actions={[
              {
                key: "confirm",
                label: "Confirmar",
                onClick: handleConfirmMarkerReposition,
                disabled: !pendingMarkerReposition
              },
              {
                key: "cancel",
                label: "Cancelar",
                onClick: handleCancelMarkerReposition
              }
            ]}
          />
        ) : null}

        <WorldMapCanvas
          ref={canvasRef}
          mapSrc={mapSrc}
          isFullscreen={isFullscreen}
          isInteractive={isInteractive}
          isBrushMode={isBrushMode}
          brushColor={brushColor}
          brushSize={brushSize}
          isMarkerSelectionMode={isMarkerSelectionMode}
          isMarkerRepositionMode={isMarkerRepositionMode}
          pendingMarkers={pendingMarkers}
          editingMarkerPreview={
            editingMarker
              ? {
                  ...editingMarker,
                  name: editingMarkerName || editingMarker.name,
                  color: editingMarkerColor,
                  size: editingMarkerSize,
                  pinStyle: editingMarkerPinStyle,
                  x: pendingMarkerReposition?.x ?? editingMarker.x,
                  y: pendingMarkerReposition?.y ?? editingMarker.y
                }
              : null
          }
          markerGroupColor={markerGroupColor}
          allMarkerGroups={displayMarkerGroups}
          areMarkersVisible={areMarkersVisible}
          visibleMarkerGroupIds={visibleMarkerGroupIds}
          onAddPendingMarker={(pointer) => {
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
                size: DEFAULT_MARKER_SIZE,
                pinStyle: "default"
              }
            ])
          }}
          onRepositionMarker={handleMarkerReposition}
          onMarkerPinSelect={handleMarkerPinSelect}
          onEnableInteraction={handleEnableInteraction}
          onMapSrcError={handleMapSrcError}
        />

        <button
          type="button"
          onClick={toggleFullscreen}
          className={styles.expandButton}
          aria-label={
            isFullscreen ? "Fechar mapa completo" : "Abrir mapa completo"
          }
          title={isFullscreen ? "Fechar" : "Abrir"}
        >
          <Image
            src={isFullscreen ? "/icons/closeImg.svg" : "/icons/openImg.svg"}
            alt={isFullscreen ? "Fechar" : "Abrir"}
            width={18}
            height={18}
          />
        </button>

        <WorldMapMarkerModals
          markerGroups={markerGroups}
          modalFlow={modalFlow}
          selection={selection}
          markerImageActions={markerImageActions}
          displayMarkerGroups={displayMarkerGroups}
          linkedSections={linkedSections}
          sectionOptions={sectionOptions}
          markerColors={MARKER_COLORS}
          canEditContent={canEditContent}
          canManagePublicMarkers={canManagePublicMarkers}
          isFullscreen={isFullscreen}
          onExitFullscreen={toggleFullscreen}
          onOpenLinkedSection={onOpenLinkedSection}
          onSaveMarkerSectionLink={onSaveMarkerSectionLink}
        />

        {canManageImage ? (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleMapFileChange}
          />
        ) : null}
      </div>

      {canManageImage ? (
        <>
          {uploadMessage ? (
            <p className={styles.statusText}>{uploadMessage}</p>
          ) : null}

          <MapImageModal
            modalRef={imageModalRef}
            isOpen={isImageModalOpen}
            isUploading={isUploading}
            hasCustomMapImage={mapSrc !== DEFAULT_MAP_SRC}
            onOpenFilePicker={handleOpenFilePicker}
            onResetMapImage={handleResetMapImage}
            onClose={() => setIsImageModalOpen(false)}
          />
        </>
      ) : null}
    </section>
  )
}
