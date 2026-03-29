"use client"

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
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
import { useWorldMapMarkerModalFlow } from "@/presentation/rpg-map/hooks/useWorldMapMarkerModalFlow"
import { useModalFocusTrap } from "@/presentation/rpg-map/hooks/useModalFocusTrap"
import { useWorldMapMarkerSelection } from "@/presentation/rpg-map/hooks/useWorldMapMarkerSelection"
import { DEFAULT_BRUSH_COLORS, useWorldMapUiState } from "@/presentation/rpg-map/hooks/useWorldMapUiState"
import { buildDisplayMarkerGroups, findMarkerSelectionById } from "@/presentation/rpg-map/utils/markerDisplay"
import styles from "./WorldMap.module.css"
import type { LinkedSectionSnapshot, MapMarkerItem } from "./types/mapMarkers"

const DEFAULT_MAP_SRC = "/map/world-map.png"
const MARKER_COLORS = ["#f97316", "#f5b33b", "#60a5fa", "#34d399", "#f472b6", "#a78bfa"]
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
  onSaveMarkerSectionLink?: (markerId: string, sectionId: string | null) => Promise<void> | void
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
  onSaveMarkerSectionLink,
}: MundiMapProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<WorldMapCanvasHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mapSrc, setMapSrc] = useState(initialMapSrc || DEFAULT_MAP_SRC)
  const markersModalRef = useRef<HTMLElement | null>(null)
  const finalizeModalRef = useRef<HTMLElement | null>(null)
  const markerListModalRef = useRef<HTMLElement | null>(null)
  const markerEditModalRef = useRef<HTMLElement | null>(null)
  const imageModalRef = useRef<HTMLDivElement | null>(null)
  const markerSheetRef = useRef<HTMLDivElement | null>(null)
  const overlappingMarkersModalRef = useRef<HTMLDivElement | null>(null)
  const [editingLinkedSectionId, setEditingLinkedSectionId] = useState("")

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
    clearLastDrawing,
  } = useWorldMapUiState({
    frameRef,
    canvasRef,
    canEditContent,
  })

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

  const displayMarkerGroups = useMemo(() => {
    return buildDisplayMarkerGroups(allMarkerGroups, linkedSections)
  }, [allMarkerGroups, linkedSections])
  const linkedSectionsByMarkerId = useMemo(
    () => new Map(linkedSections.map((section) => [section.markerId, section])),
    [linkedSections],
  )

  const {
    isImageModalOpen,
    isMarkerFinalizeModalOpen,
    isMarkerListModalOpen,
    isMarkerRepositionMode,
    isMarkersModalOpen,
    pendingMarkerReposition,
    setIsImageModalOpen,
    setIsMarkerListModalOpen,
    setIsMarkersModalOpen,
    setIsMarkerRepositionMode,
    closeTransientUi,
    handleCancelMarkerReposition,
    handleCancelMarkerSelection,
    handleConfirmMarkerReposition,
    handleConcludeMarkerSelection,
    handleDeleteMarkerGroup,
    handleEditSelectedMarkerGroup,
    handleEscape,
    handleMarkerReposition,
    handleOpenMarkersModal,
    handleSaveMarkerGroup,
    handleStartMarkerReposition,
    handleStartMarkerSelection,
  } = useWorldMapMarkerModalFlow({
    openMarkersModal,
    startMarkerSelection,
    cancelMarkerSelection,
    concludeMarkerSelection,
    saveMarkerGroup,
    openMarkerList,
    deleteMarkerGroup,
    setAreMarkersVisible,
    setEditingMarker,
    setEditingMarkerPosition,
  })

  const {
    selectedMapMarker,
    overlappingMarkers,
    setSelectedMapMarker,
    setOverlappingMarkers,
    handleMarkerPinSelect,
    beginMarkerEditing,
  } = useWorldMapMarkerSelection({
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
    setIsInteractive,
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
    if (isFullscreen) {
      return
    }

    setSelectedMapMarker(null)
    setOverlappingMarkers(null)
    setIsMarkerRepositionMode(false)
  }, [isFullscreen])

  useEffect(() => {
    if (!editingMarker) {
      setEditingLinkedSectionId("")
      return
    }

    setEditingLinkedSectionId(linkedSectionsByMarkerId.get(editingMarker.id)?.sectionId ?? "")
  }, [editingMarker, linkedSectionsByMarkerId])

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
      handleEscape({
        editingMarker,
        hasOverlappingMarkers: Boolean(overlappingMarkers),
        hasSelectedMapMarker: Boolean(selectedMapMarker),
        clearEditingMarker: () => setEditingMarker(null),
        clearOverlappingMarkers: () => setOverlappingMarkers(null),
        clearSelectedMapMarker: () => setSelectedMapMarker(null),
      })
    },
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

  function handleEditSelectedMapMarker() {
    const editingTarget = beginMarkerEditing()
    if (!editingTarget) {
      return
    }

    const { group: matchedGroup, marker: matchedMarker } = editingTarget
    setSelectedVisibility(matchedGroup.visibility)
    setSelectedMarkerGroupId(matchedGroup.id)
    setEditingMarker(matchedMarker)
    setEditingMarkerName(matchedMarker.name)
    setEditingMarkerLocation(matchedMarker.location ?? "")
    setEditingMarkerShortDescription(matchedMarker.shortDescription ?? "")
    setEditingMarkerImage(matchedMarker.image ?? "")
    setEditingMarkerColor(matchedMarker.color || matchedGroup.color)
    setEditingMarkerSize(matchedMarker.size ?? DEFAULT_MARKER_SIZE)
    setEditingMarkerPinStyle(matchedMarker.pinStyle === "label" ? "label" : "default")
  }

  async function handleSaveMarkerEditWithSectionLink() {
    const markerId = editingMarker?.id ?? null
    saveMarkerEdit()

    if (!markerId || !onSaveMarkerSectionLink) {
      return
    }

    await onSaveMarkerSectionLink(markerId, editingLinkedSectionId || null)
  }

  function handleOpenMarkerFromGroup(markerId: string) {
    const selection = findMarkerSelectionById(displayMarkerGroups, markerId)
    if (!selection) {
      return
    }

    setIsMarkerListModalOpen(false)
    setSelectedMapMarker({
      marker: selection.marker,
      groupColor: selection.groupColor,
    })
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
            description={`Clique no mapa para definir a nova posicao de ${editingMarkerName || "Marcador"} e confirme para aplicar.`}
            actions={[
              {
                key: "confirm",
                label: "Confirmar",
                onClick: handleConfirmMarkerReposition,
                disabled: !pendingMarkerReposition,
              },
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
              {DEFAULT_BRUSH_COLORS.map((color) => (
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
            x: pendingMarkerReposition?.x ?? editingMarker.x,
            y: pendingMarkerReposition?.y ?? editingMarker.y,
          } : null}
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
          onEdit={(groupId) => {
            setSelectedMarkerGroupId(groupId)
            if (openMarkerList(groupId)) {
              setIsMarkersModalOpen(false)
              setIsMarkerListModalOpen(true)
            }
          }}
          onDeleteGroup={(groupId) => deleteMarkerGroup(groupId)}
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
          setMarkerGroupName={setMarkerGroupName}
          setMarkerGroupColor={setMarkerGroupColor}
          setPendingMarkers={setPendingMarkers}
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
          canPublish={selectedMarkerGroup?.visibility === "private" && canManagePublicMarkers}
          onChangeGroupName={setEditingGroupName}
          onChangeGroupColor={setEditingGroupColor}
          onAddMarkers={() => {
            if (!selectedMarkerGroup) {
              return
            }

            setIsMarkerListModalOpen(false)
            startMarkerSelection(selectedMarkerGroup.id)
          }}
          onOpenMarker={(marker) => handleOpenMarkerFromGroup(marker.id)}
          onEditMarker={(marker) => {
            setIsMarkerListModalOpen(false)
            openMarkerEdit(marker)
          }}
          onDeleteMarker={deleteMarkerItem}
          onSaveGroup={saveMarkerGroupChanges}
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
            linkedSectionId={editingLinkedSectionId}
            sectionOptions={sectionOptions}
            isImageUploading={isMarkerImageUploading}
            markerId={editingMarker.id}
            onChangeName={setEditingMarkerName}
            onChangeLocation={setEditingMarkerLocation}
            onChangeDescription={setEditingMarkerShortDescription}
            onChangeColor={setEditingMarkerColor}
            onChangeSize={setEditingMarkerSize}
            onChangePinStyle={setEditingMarkerPinStyle}
            onChangeLinkedSection={setEditingLinkedSectionId}
            onPickImage={openMarkerImagePicker}
            onDeleteImage={handleDeleteMarkerImage}
              onChangePosition={() => {
                handleStartMarkerReposition(editingMarker)
              }}
            onSave={() => void handleSaveMarkerEditWithSectionLink()}
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
            canEdit={Boolean(selectedMapMarker.marker.canEdit)}
            sheetRef={markerSheetRef}
            linkedSectionName={linkedSectionsByMarkerId.get(selectedMapMarker.marker.id)?.name ?? null}
            onEdit={handleEditSelectedMapMarker}
            onMoreInfo={
              linkedSectionsByMarkerId.get(selectedMapMarker.marker.id)?.sectionId && onOpenLinkedSection
                ? () => {
                    const sectionId = linkedSectionsByMarkerId.get(selectedMapMarker.marker.id)?.sectionId
                    setSelectedMapMarker(null)
                    if (sectionId) {
                      if (isFullscreen) {
                        toggleFullscreen()
                      }
                      onOpenLinkedSection(sectionId)
                    }
                  }
                : undefined
            }
            onClose={() => setSelectedMapMarker(null)}
          />
        ) : null}

        <input
          ref={markerImageInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handleMarkerImageChange}
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
