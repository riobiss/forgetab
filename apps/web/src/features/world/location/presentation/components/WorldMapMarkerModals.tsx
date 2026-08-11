import { useEffect, useMemo, useRef, useState } from "react"
import { MapMarkerBottomSheet } from "./MapMarkerBottomSheet"
import { MapMarkersModal } from "./MapMarkersModal"
import { MarkerEditModal } from "./MarkerEditModal"
import { MarkerFinalizeModal } from "./MarkerFinalizeModal"
import { MarkerGroupModal } from "./MarkerGroupModal"
import { OverlappingMarkersModal } from "./OverlappingMarkersModal"
import { useModalFocusTrap } from "@/shared/presentation/hooks/useModalFocusTrap"
import type { useMapMarkerGroups } from "@/features/world/location/presentation/hooks/useMapMarkerGroups"
import type { useMarkerImageActions } from "@/features/world/location/presentation/hooks/useMarkerImageActions"
import type { useWorldMapMarkerModalFlow } from "@/features/world/location/presentation/hooks/useWorldMapMarkerModalFlow"
import type { useWorldMapMarkerSelection } from "@/features/world/location/presentation/hooks/useWorldMapMarkerSelection"
import { findMarkerSelectionById } from "@/features/world/location/presentation/utils/markerDisplay"
import type {
  LinkedSectionSnapshot,
  MarkerGroup
} from "@/features/world/location/presentation/types/mapMarkers"
import styles from "../WorldMap.module.css"

type Props = {
  markerGroups: ReturnType<typeof useMapMarkerGroups>
  modalFlow: ReturnType<typeof useWorldMapMarkerModalFlow>
  selection: ReturnType<typeof useWorldMapMarkerSelection>
  markerImageActions: ReturnType<typeof useMarkerImageActions>
  displayMarkerGroups: MarkerGroup[]
  linkedSections: LinkedSectionSnapshot[]
  sectionOptions: Array<{ id: string; name: string }>
  markerColors: string[]
  canEditContent: boolean
  canManagePublicMarkers: boolean
  isFullscreen: boolean
  onExitFullscreen: () => void
  onOpenLinkedSection?: (sectionId: string) => void
  onSaveMarkerSectionLink?: (
    markerId: string,
    sectionId: string | null
  ) => Promise<void> | void
}

export function WorldMapMarkerModals({
  markerGroups,
  modalFlow,
  selection,
  markerImageActions,
  displayMarkerGroups,
  linkedSections,
  sectionOptions,
  markerColors,
  canEditContent,
  canManagePublicMarkers,
  isFullscreen,
  onExitFullscreen,
  onOpenLinkedSection,
  onSaveMarkerSectionLink
}: Props) {
  const markersModalRef = useRef<HTMLElement | null>(null)
  const finalizeModalRef = useRef<HTMLElement | null>(null)
  const markerListModalRef = useRef<HTMLElement | null>(null)
  const markerEditModalRef = useRef<HTMLElement | null>(null)
  const markerSheetRef = useRef<HTMLDivElement | null>(null)
  const overlappingMarkersModalRef = useRef<HTMLDivElement | null>(null)
  const [editingLinkedSectionId, setEditingLinkedSectionId] = useState("")
  const linkedSectionsByMarkerId = useMemo(
    () => new Map(linkedSections.map((section) => [section.markerId, section])),
    [linkedSections]
  )

  useEffect(() => {
    if (!markerGroups.editingMarker) {
      setEditingLinkedSectionId("")
      return
    }
    setEditingLinkedSectionId(
      linkedSectionsByMarkerId.get(markerGroups.editingMarker.id)?.sectionId ??
        ""
    )
  }, [linkedSectionsByMarkerId, markerGroups.editingMarker])

  const activeModalElement = markerGroups.editingMarker
    ? markerEditModalRef.current
    : selection.overlappingMarkers
      ? overlappingMarkersModalRef.current
      : selection.selectedMapMarker
        ? markerSheetRef.current
        : modalFlow.isMarkerListModalOpen
          ? markerListModalRef.current
          : modalFlow.isMarkerFinalizeModalOpen
            ? finalizeModalRef.current
            : modalFlow.isMarkersModalOpen
              ? markersModalRef.current
              : null

  useModalFocusTrap({
    isActive: activeModalElement !== null,
    activeElement: activeModalElement,
    onEscape: () => {
      modalFlow.handleEscape({
        editingMarker: markerGroups.editingMarker,
        hasOverlappingMarkers: Boolean(selection.overlappingMarkers),
        hasSelectedMapMarker: Boolean(selection.selectedMapMarker),
        clearEditingMarker: () => markerGroups.setEditingMarker(null),
        clearOverlappingMarkers: () => selection.setOverlappingMarkers(null),
        clearSelectedMapMarker: () => selection.setSelectedMapMarker(null)
      })
    }
  })

  function editSelectedMarker() {
    const target = selection.beginMarkerEditing()
    if (!target) return
    const { group, marker } = target
    markerGroups.setSelectedVisibility(group.visibility)
    markerGroups.setSelectedMarkerGroupId(group.id)
    markerGroups.setEditingMarker(marker)
    markerGroups.setEditingMarkerName(marker.name)
    markerGroups.setEditingMarkerLocation(marker.location ?? "")
    markerGroups.setEditingMarkerShortDescription(marker.shortDescription ?? "")
    markerGroups.setEditingMarkerImage(marker.image ?? "")
    markerGroups.setEditingMarkerColor(marker.color || group.color)
    markerGroups.setEditingMarkerSize(marker.size ?? 1)
    markerGroups.setEditingMarkerPinStyle(
      marker.pinStyle === "label" ? "label" : "default"
    )
  }

  async function saveMarkerWithSectionLink() {
    const markerId = markerGroups.editingMarker?.id ?? null
    const saved = await markerGroups.saveMarkerEdit()
    if (saved && markerId && onSaveMarkerSectionLink) {
      await onSaveMarkerSectionLink(markerId, editingLinkedSectionId || null)
    }
  }

  function openMarkerFromGroup(markerId: string) {
    const match = findMarkerSelectionById(displayMarkerGroups, markerId)
    if (!match) return
    modalFlow.setIsMarkerListModalOpen(false)
    selection.setSelectedMapMarker({
      marker: match.marker,
      groupColor: match.groupColor
    })
  }

  return (
    <>
      <MapMarkersModal
        modalRef={markersModalRef}
        isOpen={modalFlow.isMarkersModalOpen}
        isBusy={markerGroups.isMarkerGroupOperationPending}
        canCreateMarkers={canEditContent}
        selectedVisibility={markerGroups.selectedVisibility}
        selectedMarkerGroupId={markerGroups.selectedMarkerGroupId}
        selectedMarkerGroups={markerGroups.selectedMarkerGroups}
        allMarkerGroups={markerGroups.allMarkerGroups}
        visibleMarkerGroupIds={markerGroups.visibleMarkerGroupIds}
        setSelectedVisibility={markerGroups.setSelectedVisibility}
        setSelectedMarkerGroupId={markerGroups.setSelectedMarkerGroupId}
        setAreMarkersVisible={markerGroups.setAreMarkersVisible}
        setVisibleMarkerGroupIds={markerGroups.setVisibleMarkerGroupIds}
        toggleMarkerGroupVisibility={markerGroups.toggleMarkerGroupVisibility}
        onCreate={modalFlow.handleStartMarkerSelection}
        onEdit={(groupId) => {
          markerGroups.setSelectedMarkerGroupId(groupId)
          if (markerGroups.openMarkerList(groupId)) {
            modalFlow.setIsMarkersModalOpen(false)
            modalFlow.setIsMarkerListModalOpen(true)
          }
        }}
        onDeleteGroup={markerGroups.deleteMarkerGroup}
        onClear={markerGroups.clearAllMarkers}
        onClose={() => modalFlow.setIsMarkersModalOpen(false)}
      />

      <MarkerFinalizeModal
        modalRef={finalizeModalRef}
        isOpen={modalFlow.isMarkerFinalizeModalOpen}
        markerGroupName={markerGroups.markerGroupName}
        markerGroupColor={markerGroups.markerGroupColor}
        markerColors={markerColors}
        pendingMarkers={markerGroups.pendingMarkers}
        setMarkerGroupName={markerGroups.setMarkerGroupName}
        setMarkerGroupColor={markerGroups.setMarkerGroupColor}
        setPendingMarkers={markerGroups.setPendingMarkers}
        onSave={modalFlow.handleSaveMarkerGroup}
        onClose={modalFlow.handleCancelMarkerSelection}
      />

      <MarkerGroupModal
        modalRef={markerListModalRef}
        isOpen={modalFlow.isMarkerListModalOpen}
        isBusy={markerGroups.isMarkerGroupOperationPending}
        group={markerGroups.selectedMarkerGroup}
        editingGroupName={markerGroups.editingGroupName}
        editingGroupColor={markerGroups.editingGroupColor}
        markerColors={markerColors}
        canPublish={
          markerGroups.selectedMarkerGroup?.visibility === "private" &&
          canManagePublicMarkers
        }
        onChangeGroupName={markerGroups.setEditingGroupName}
        onChangeGroupColor={markerGroups.setEditingGroupColor}
        onAddMarkers={() => {
          if (!markerGroups.selectedMarkerGroup) return
          modalFlow.setIsMarkerListModalOpen(false)
          markerGroups.startMarkerSelection(markerGroups.selectedMarkerGroup.id)
        }}
        onOpenMarker={(marker) => openMarkerFromGroup(marker.id)}
        onEditMarker={(marker) => {
          modalFlow.setIsMarkerListModalOpen(false)
          markerGroups.openMarkerEdit(marker)
        }}
        onDeleteMarker={markerGroups.deleteMarkerItem}
        onSaveGroup={markerGroups.saveMarkerGroupChanges}
        onPublish={markerGroups.publishSelectedMarkerGroup}
        onDeleteGroup={modalFlow.handleDeleteMarkerGroup}
        onClose={() => modalFlow.setIsMarkerListModalOpen(false)}
      />

      {markerGroups.editingMarker &&
      markerGroups.selectedMarkerGroup &&
      !modalFlow.isMarkerRepositionMode ? (
        <MarkerEditModal
          modalRef={markerEditModalRef}
          markerName={markerGroups.editingMarkerName}
          markerLocation={markerGroups.editingMarkerLocation}
          markerImage={markerGroups.editingMarkerImage}
          markerDescription={markerGroups.editingMarkerShortDescription}
          markerColor={markerGroups.editingMarkerColor}
          markerSize={markerGroups.editingMarkerSize}
          markerPinStyle={markerGroups.editingMarkerPinStyle}
          markerColors={markerColors}
          linkedSectionId={editingLinkedSectionId}
          sectionOptions={sectionOptions}
          isImageUploading={markerImageActions.isUploading}
          isSaving={markerGroups.isMarkerGroupOperationPending}
          markerId={markerGroups.editingMarker.id}
          onChangeName={markerGroups.setEditingMarkerName}
          onChangeLocation={markerGroups.setEditingMarkerLocation}
          onChangeDescription={markerGroups.setEditingMarkerShortDescription}
          onChangeColor={markerGroups.setEditingMarkerColor}
          onChangeSize={markerGroups.setEditingMarkerSize}
          onChangePinStyle={markerGroups.setEditingMarkerPinStyle}
          onChangeLinkedSection={setEditingLinkedSectionId}
          onPickImage={markerImageActions.openPicker}
          onDeleteImage={markerImageActions.deleteImage}
          onChangePosition={() =>
            modalFlow.handleStartMarkerReposition(markerGroups.editingMarker!)
          }
          onSave={() => void saveMarkerWithSectionLink()}
          onClose={() => markerGroups.setEditingMarker(null)}
        />
      ) : null}

      {selection.overlappingMarkers ? (
        <OverlappingMarkersModal
          modalRef={overlappingMarkersModalRef}
          markers={selection.overlappingMarkers}
          onSelect={({ marker, groupColor }) => {
            selection.setOverlappingMarkers(null)
            selection.setSelectedMapMarker({ marker, groupColor })
          }}
          onClose={() => selection.setOverlappingMarkers(null)}
        />
      ) : null}

      {selection.selectedMapMarker ? (
        <MapMarkerBottomSheet
          marker={selection.selectedMapMarker.marker}
          canEdit={Boolean(selection.selectedMapMarker.marker.canEdit)}
          sheetRef={markerSheetRef}
          linkedSectionName={
            linkedSectionsByMarkerId.get(selection.selectedMapMarker.marker.id)
              ?.name ?? null
          }
          onEdit={editSelectedMarker}
          onMoreInfo={
            linkedSectionsByMarkerId.get(selection.selectedMapMarker.marker.id)
              ?.sectionId && onOpenLinkedSection
              ? () => {
                  const sectionId = linkedSectionsByMarkerId.get(
                    selection.selectedMapMarker!.marker.id
                  )?.sectionId
                  selection.setSelectedMapMarker(null)
                  if (sectionId) {
                    if (isFullscreen) onExitFullscreen()
                    onOpenLinkedSection(sectionId)
                  }
                }
              : undefined
          }
          onClose={() => selection.setSelectedMapMarker(null)}
        />
      ) : null}

      <input
        ref={markerImageActions.fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={markerImageActions.handleInputChange}
      />
    </>
  )
}
