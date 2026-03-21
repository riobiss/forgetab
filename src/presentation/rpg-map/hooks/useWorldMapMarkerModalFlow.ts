"use client"

import { useState } from "react"
import type { MapMarkerItem } from "@/presentation/rpg-map/types/mapMarkers"

type Params = {
  openMarkersModal: () => void
  startMarkerSelection: () => void
  cancelMarkerSelection: () => void
  concludeMarkerSelection: () => boolean
  saveMarkerGroup: () => unknown
  openMarkerList: () => boolean
  deleteMarkerGroup: () => void
  setAreMarkersVisible: (value: boolean) => void
  setEditingMarker: (marker: MapMarkerItem | null) => void
  setEditingMarkerPosition: (position: { x: number; y: number }) => void
}

export function useWorldMapMarkerModalFlow(params: Params) {
  const [isMarkersModalOpen, setIsMarkersModalOpen] = useState(false)
  const [isMarkerFinalizeModalOpen, setIsMarkerFinalizeModalOpen] = useState(false)
  const [isMarkerListModalOpen, setIsMarkerListModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isMarkerRepositionMode, setIsMarkerRepositionMode] = useState(false)
  const [pendingMarkerReposition, setPendingMarkerReposition] = useState<{ x: number; y: number } | null>(null)

  function closeTransientUi() {
    setIsMarkersModalOpen(false)
    setIsMarkerFinalizeModalOpen(false)
    setIsMarkerListModalOpen(false)
    setIsImageModalOpen(false)
  }

  function handleOpenMarkersModal() {
    params.setAreMarkersVisible(true)
    params.openMarkersModal()
    setIsMarkersModalOpen(true)
  }

  function handleStartMarkerSelection() {
    params.setAreMarkersVisible(true)
    params.startMarkerSelection()
    setIsMarkersModalOpen(false)
    setIsMarkerFinalizeModalOpen(false)
    setIsMarkerListModalOpen(false)
    params.setEditingMarker(null)
    setIsMarkerRepositionMode(false)
  }

  function handleCancelMarkerSelection() {
    params.cancelMarkerSelection()
    setIsMarkerFinalizeModalOpen(false)
  }

  function handleConcludeMarkerSelection() {
    if (params.concludeMarkerSelection()) {
      setIsMarkerFinalizeModalOpen(true)
    }
  }

  function handleSaveMarkerGroup() {
    const result = params.saveMarkerGroup()
    if (result) {
      setIsMarkerFinalizeModalOpen(false)
    }
  }

  function handleDeleteMarkerGroup() {
    params.deleteMarkerGroup()
    setIsMarkerListModalOpen(false)
    setIsMarkersModalOpen(false)
  }

  function handleEditSelectedMarkerGroup() {
    if (params.openMarkerList()) {
      setIsMarkersModalOpen(false)
      setIsMarkerListModalOpen(true)
    }
  }

  function handleStartMarkerReposition(editingMarker: MapMarkerItem | null) {
    if (!editingMarker) {
      return
    }

    setPendingMarkerReposition({ x: editingMarker.x, y: editingMarker.y })
    setIsMarkerRepositionMode(true)
  }

  function handleMarkerReposition(pointer: { x: number; y: number }) {
    setPendingMarkerReposition(pointer)
  }

  function handleConfirmMarkerReposition() {
    if (!pendingMarkerReposition) {
      return
    }

    params.setEditingMarkerPosition(pendingMarkerReposition)
    setIsMarkerRepositionMode(false)
    setPendingMarkerReposition(null)
  }

  function handleCancelMarkerReposition() {
    setIsMarkerRepositionMode(false)
    setPendingMarkerReposition(null)
  }

  function handleEscape(options: {
    editingMarker: MapMarkerItem | null
    hasOverlappingMarkers: boolean
    hasSelectedMapMarker: boolean
    clearEditingMarker: () => void
    clearOverlappingMarkers: () => void
    clearSelectedMapMarker: () => void
  }) {
    if (options.editingMarker) {
      options.clearEditingMarker()
    } else if (options.hasOverlappingMarkers) {
      options.clearOverlappingMarkers()
    } else if (options.hasSelectedMapMarker) {
      options.clearSelectedMapMarker()
    } else if (isImageModalOpen) {
      setIsImageModalOpen(false)
    } else if (isMarkerListModalOpen) {
      setIsMarkerListModalOpen(false)
    } else if (isMarkerFinalizeModalOpen) {
      setIsMarkerFinalizeModalOpen(false)
    } else if (isMarkersModalOpen) {
      setIsMarkersModalOpen(false)
    }
  }

  return {
    isImageModalOpen,
    isMarkerFinalizeModalOpen,
    isMarkerListModalOpen,
    pendingMarkerReposition,
    isMarkerRepositionMode,
    isMarkersModalOpen,
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
  }
}
