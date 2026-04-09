"use client"

import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react"
import type { WorldMapCanvasHandle } from "@/presentation/rpg-map/components/WorldMapCanvas"
import type { MapMarkerItem, MarkerGroup } from "@/presentation/rpg-map/types/mapMarkers"
import {
  findMarkerSelectionById,
  findNearbyMarkerSelections,
  type DisplayMapMarkerSelection,
} from "@/presentation/rpg-map/utils/markerDisplay"

type Params = {
  displayMarkerGroups: MarkerGroup[]
  allMarkerGroups: MarkerGroup[]
  visibleMarkerGroupIds: string[]
  focusMarkerRequest?: { markerId: string; token: number } | null
  overlapDistance: number
  frameRef: MutableRefObject<HTMLDivElement | null>
  canvasRef: MutableRefObject<WorldMapCanvasHandle | null>
  setAreMarkersVisible: (value: boolean) => void
  setVisibleMarkerGroupIds: Dispatch<SetStateAction<string[]>>
  closeTransientUi: () => void
  setIsInteractive: (value: boolean) => void
}

export function useWorldMapMarkerSelection(params: Params) {
  const {
    allMarkerGroups,
    canvasRef,
    closeTransientUi,
    displayMarkerGroups,
    focusMarkerRequest,
    frameRef,
    overlapDistance,
    setAreMarkersVisible,
    setIsInteractive,
    setVisibleMarkerGroupIds,
    visibleMarkerGroupIds,
  } = params
  const [selectedMapMarker, setSelectedMapMarker] = useState<DisplayMapMarkerSelection | null>(null)
  const [overlappingMarkers, setOverlappingMarkers] = useState<DisplayMapMarkerSelection[] | null>(null)
  const lastHandledFocusTokenRef = useRef<number | null>(null)

  useEffect(() => {
    if (!focusMarkerRequest) {
      return
    }

    if (lastHandledFocusTokenRef.current === focusMarkerRequest.token) {
      return
    }

    const match = findMarkerSelectionById(displayMarkerGroups, focusMarkerRequest.markerId)
    if (!match) {
      return
    }

    lastHandledFocusTokenRef.current = focusMarkerRequest.token

    setAreMarkersVisible(true)
    setVisibleMarkerGroupIds((current) =>
      current.includes(match.group.id) ? current : [...current, match.group.id],
    )
    closeTransientUi()
    setOverlappingMarkers(null)
    setSelectedMapMarker(null)

    const focusMarker = async () => {
      const frame = frameRef.current
      if (!frame) {
        return
      }

      if (document.fullscreenElement !== frame) {
        await frame.requestFullscreen()
      }

      setIsInteractive(true)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          canvasRef.current?.focusMarker(match.marker)
          setSelectedMapMarker({
            marker: match.marker,
            groupColor: match.groupColor,
          })
        })
      })
    }

    void focusMarker()
  }, [
    canvasRef,
    closeTransientUi,
    displayMarkerGroups,
    focusMarkerRequest,
    frameRef,
    setAreMarkersVisible,
    setIsInteractive,
    setVisibleMarkerGroupIds,
  ])

  function handleMarkerPinSelect(clickedMarker: MapMarkerItem, groupColor: string) {
    const nearbyMarkers = findNearbyMarkerSelections(
      displayMarkerGroups,
      visibleMarkerGroupIds,
      clickedMarker,
      overlapDistance,
    )

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

  function beginMarkerEditing() {
    if (!selectedMapMarker) {
      return null
    }

    const matchedGroup = allMarkerGroups.find((group) =>
      group.markers.some((marker) => marker.id === selectedMapMarker.marker.id),
    )
    const matchedMarker = matchedGroup?.markers.find((marker) => marker.id === selectedMapMarker.marker.id) ?? null

    if (!matchedGroup || !matchedMarker?.canEdit || !matchedGroup.canEdit) {
      return null
    }

    setSelectedMapMarker(null)
    return {
      group: matchedGroup,
      marker: matchedMarker,
    }
  }

  return {
    selectedMapMarker,
    overlappingMarkers,
    setSelectedMapMarker,
    setOverlappingMarkers,
    handleMarkerPinSelect,
    beginMarkerEditing,
  }
}
