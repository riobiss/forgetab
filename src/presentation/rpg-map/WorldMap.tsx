"use client"

import { type ChangeEvent, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import type { RpgMapMarkerGroupDto } from "@/application/rpgMap/types"
import { MapInteractionBanner } from "@/presentation/rpg-map/components/MapInteractionBanner"
import { MapImageModal } from "@/presentation/rpg-map/components/MapImageModal"
import { MapMarkerBottomSheet } from "@/presentation/rpg-map/components/MapMarkerBottomSheet"
import { MapMarkersModal } from "@/presentation/rpg-map/components/MapMarkersModal"
import { MarkerFinalizeModal } from "@/presentation/rpg-map/components/MarkerFinalizeModal"
import { MarkerGroupModal } from "@/presentation/rpg-map/components/MarkerGroupModal"
import { MarkerEditModal } from "@/presentation/rpg-map/components/MarkerEditModal"
import { OverlappingMarkersModal } from "@/presentation/rpg-map/components/OverlappingMarkersModal"
import { WorldMapCanvas, type WorldMapCanvasHandle } from "@/presentation/rpg-map/components/WorldMapCanvas"
import { useMarkerImageActions } from "@/presentation/rpg-map/hooks/useMarkerImageActions"
import { useRpgMapImageActions } from "@/presentation/rpg-map/hooks/useRpgMapImageActions"
import { useMapMarkerGroups } from "@/presentation/rpg-map/hooks/useMapMarkerGroups"
import { useModalFocusTrap } from "@/presentation/rpg-map/hooks/useModalFocusTrap"
import styles from "./WorldMap.module.css"
import type { MapMarkerItem } from "./types/mapMarkers"

const DEFAULT_MAP_SRC = "/map/world-map.png"
const BRUSH_COLORS = ["#c4243b", "#ff7a18", "#f5e6c8", "#4f9cff", "#34c759"]
const MARKER_COLORS = ["#f97316", "#f5b33b", "#60a5fa", "#34d399", "#f472b6", "#a78bfa"]
const DEFAULT_MARKER_SIZE = 1
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
  const canvasRef = useRef<WorldMapCanvasHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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
  const [isMarkerRepositionMode, setIsMarkerRepositionMode] = useState(false)
  const [selectedMapMarker, setSelectedMapMarker] = useState<{
    marker: MapMarkerItem
    groupColor: string
  } | null>(null)
  const [overlappingMarkers, setOverlappingMarkers] = useState<Array<{
    marker: MapMarkerItem
    groupColor: string
  }> | null>(null)
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
    editingMarkerSize,
    editingMarkerPinStyle,
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
    setEditingMarkerSize,
    setEditingMarkerPinStyle,
    setEditingGroupName,
    setEditingGroupColor,
    setAreMarkersVisible,
    setVisibleMarkerGroupIds,
    setEditingMarkerPosition,
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

  const {
    fileInputRef: markerImageInputRef,
    isUploading: isMarkerImageUploading,
    openPicker: openMarkerImagePicker,
    handleInputChange: handleMarkerImageChange,
    deleteImage: handleDeleteMarkerImage,
  } = useMarkerImageActions({
    resolveOldImage(target) {
      if (target.mode === "pending") {
        return pendingMarkers.find((marker) => marker.id === target.markerId)?.image ?? null
      }

      return editingMarkerImage || null
    },
    applyUploadedImage(target, url) {
      if (target.mode === "pending") {
        setPendingMarkers((current) =>
          current.map((marker) =>
            marker.id === target.markerId
              ? { ...marker, image: url }
              : marker,
          ),
        )
        return
      }

      setEditingMarkerImage(url)
    },
    applyRemovedImage(target) {
      if (target.mode === "pending") {
        setPendingMarkers((current) =>
          current.map((marker) =>
            marker.id === target.markerId
              ? { ...marker, image: "" }
              : marker,
          ),
        )
        return
      }

      setEditingMarkerImage("")
    },
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
    if (isFullscreen) {
      return
    }

    setSelectedMapMarker(null)
    setOverlappingMarkers(null)
    setIsMarkerRepositionMode(false)
  }, [isFullscreen])

  const activeModalElement = editingMarker
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

  useModalFocusTrap({
    activeElement: activeModalElement,
    onEscape: () => {
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
    },
  })

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
    canvasRef.current?.resetView()
  }

  const toggleBrushMode = () => {
    if (!isInteractive) {
      return
    }

    setIsBrushMode((prev) => !prev)
  }

  const clearLastDrawing = () => {
    canvasRef.current?.clearLastDrawing()
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
    setIsMarkerRepositionMode(false)
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

  function handleMapSrcError() {
    if (mapSrc !== DEFAULT_MAP_SRC) {
      setMapSrc(DEFAULT_MAP_SRC)
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
    setEditingMarkerSize(selectedMapMarker.marker.size ?? DEFAULT_MARKER_SIZE)
    setEditingMarkerPinStyle(selectedMapMarker.marker.pinStyle === "label" ? "label" : "default")
    setSelectedMapMarker(null)
  }

  function handleStartMarkerReposition() {
    if (!editingMarker) {
      return
    }

    setIsMarkerRepositionMode(true)
  }

  function handleMarkerReposition(pointer: { x: number; y: number }) {
    setEditingMarkerPosition(pointer)
    setIsMarkerRepositionMode(false)
  }

  function handleCancelMarkerReposition() {
    setIsMarkerRepositionMode(false)
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
          <MapInteractionBanner
            title="Criando marcadores"
            description={`Clique no mapa para adicionar pinos e depois conclua. ${pendingMarkers.length} ponto(s) marcado(s).`}
            actions={[
              {
                key: "clear",
                label: "Limpar",
                onClick: () => setPendingMarkers([]),
                disabled: pendingMarkers.length === 0,
              },
              {
                key: "finish",
                label: "Concluir",
                onClick: handleConcludeMarkerSelection,
                disabled: pendingMarkers.length === 0,
              },
              {
                key: "cancel",
                label: "Cancelar",
                onClick: handleCancelMarkerSelection,
              },
            ]}
          />
        ) : null}

        {isMarkerRepositionMode && editingMarker ? (
          <MapInteractionBanner
            title="Reposicionando marcador"
            description={`Clique no mapa para definir a nova posicao de ${editingMarkerName || "Marcador"}.`}
            actions={[
              {
                key: "cancel",
                label: "Cancelar",
                onClick: handleCancelMarkerReposition,
              },
            ]}
          />
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
          editingMarkerPreview={editingMarker ? {
            ...editingMarker,
            name: editingMarkerName || editingMarker.name,
            color: editingMarkerColor,
            size: editingMarkerSize,
            pinStyle: editingMarkerPinStyle,
          } : null}
          markerGroupColor={markerGroupColor}
          allMarkerGroups={allMarkerGroups}
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
                pinStyle: "default",
              },
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

        <MapMarkersModal
          modalRef={markersModalRef}
          isOpen={isMarkersModalOpen}
          canCreateMarkers={canEditContent}
          selectedVisibility={selectedVisibility}
          selectedMarkerGroupId={selectedMarkerGroupId}
          selectedMarkerGroups={selectedMarkerGroups}
          selectedMarkerGroup={selectedMarkerGroup}
          allMarkerGroups={allMarkerGroups}
          visibleMarkerGroupIds={visibleMarkerGroupIds}
          setSelectedVisibility={setSelectedVisibility}
          setSelectedMarkerGroupId={setSelectedMarkerGroupId}
          setAreMarkersVisible={setAreMarkersVisible}
          setVisibleMarkerGroupIds={setVisibleMarkerGroupIds}
          toggleMarkerGroupVisibility={toggleMarkerGroupVisibility}
          onCreate={handleStartMarkerSelection}
          onEdit={handleEditSelectedMarkerGroup}
          onClear={clearAllMarkers}
          onClose={() => setIsMarkersModalOpen(false)}
        />

        <MarkerFinalizeModal
          modalRef={finalizeModalRef}
          isOpen={isMarkerFinalizeModalOpen}
          markerGroupName={markerGroupName}
          markerGroupColor={markerGroupColor}
          markerColors={MARKER_COLORS}
          pendingMarkers={pendingMarkers}
          isImageUploading={isMarkerImageUploading}
          setMarkerGroupName={setMarkerGroupName}
          setMarkerGroupColor={setMarkerGroupColor}
          setPendingMarkers={setPendingMarkers}
          onPickImage={openMarkerImagePicker}
          onDeleteImage={handleDeleteMarkerImage}
          onSave={handleSaveMarkerGroup}
          onClose={handleCancelMarkerSelection}
        />

        <MarkerGroupModal
          modalRef={markerListModalRef}
          isOpen={isMarkerListModalOpen}
          group={selectedMarkerGroup}
          editingGroupName={editingGroupName}
          editingGroupColor={editingGroupColor}
          markerColors={MARKER_COLORS}
          canPublish={selectedMarkerGroup?.visibility === "private" && canManageImage}
          onChangeGroupName={setEditingGroupName}
          onChangeGroupColor={setEditingGroupColor}
          onEditMarker={openMarkerEdit}
          onDeleteMarker={deleteMarkerItem}
          onSaveGroup={saveMarkerGroupChanges}
          onClearAll={clearAllMarkers}
          onPublish={publishSelectedMarkerGroup}
          onDeleteGroup={handleDeleteMarkerGroup}
          onClose={() => setIsMarkerListModalOpen(false)}
        />

        {editingMarker && selectedMarkerGroup && !isMarkerRepositionMode ? (
          <MarkerEditModal
            modalRef={markerEditModalRef}
            markerName={editingMarkerName}
            markerLocation={editingMarkerLocation}
            markerImage={editingMarkerImage}
            markerDescription={editingMarkerShortDescription}
            markerColor={editingMarkerColor}
            markerSize={editingMarkerSize}
            markerPinStyle={editingMarkerPinStyle}
            markerColors={MARKER_COLORS}
            isImageUploading={isMarkerImageUploading}
            markerId={editingMarker.id}
            onChangeName={setEditingMarkerName}
            onChangeLocation={setEditingMarkerLocation}
            onChangeDescription={setEditingMarkerShortDescription}
            onChangeColor={setEditingMarkerColor}
            onChangeSize={setEditingMarkerSize}
            onChangePinStyle={setEditingMarkerPinStyle}
            onPickImage={openMarkerImagePicker}
            onDeleteImage={handleDeleteMarkerImage}
            onChangePosition={handleStartMarkerReposition}
            onSave={saveMarkerEdit}
            onClose={() => setEditingMarker(null)}
          />
        ) : null}

        {overlappingMarkers ? (
          <OverlappingMarkersModal
            modalRef={overlappingMarkersModalRef}
            markers={overlappingMarkers}
            onSelect={({ marker, groupColor }) => {
              setOverlappingMarkers(null)
              setSelectedMapMarker({ marker, groupColor })
            }}
            onClose={() => setOverlappingMarkers(null)}
          />
        ) : null}

        {selectedMapMarker ? (
          <MapMarkerBottomSheet
            marker={selectedMapMarker.marker}
            sheetRef={markerSheetRef}
            onEdit={handleEditSelectedMapMarker}
            onClose={() => setSelectedMapMarker(null)}
          />
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
