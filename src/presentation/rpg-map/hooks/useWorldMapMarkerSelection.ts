"use client"

import { useEffect, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react"
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
  const [selectedMapMarker, setSelectedMapMarker] = useState<DisplayMapMarkerSelection | null>(null)
  const [overlappingMarkers, setOverlappingMarkers] = useState<DisplayMapMarkerSelection[] | null>(null)

  useEffect(() => {
    if (!params.focusMarkerRequest) {
      return
    }

    const match = findMarkerSelectionById(params.displayMarkerGroups, params.focusMarkerRequest.markerId)
    if (!match) {
      return
    }

    params.setAreMarkersVisible(true)
    params.setVisibleMarkerGroupIds((current) =>
      current.includes(match.group.id) ? current : [...current, match.group.id],
    )
    params.closeTransientUi()
    setOverlappingMarkers(null)
    setSelectedMapMarker(null)

    const focusMarker = async () => {
      const frame = params.frameRef.current
      if (!frame) {
        return
      }

      if (document.fullscreenElement !== frame) {
        await frame.requestFullscreen()
      }

      params.setIsInteractive(true)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          params.canvasRef.current?.focusMarker(match.marker)
          setSelectedMapMarker({
            marker: match.marker,
            groupColor: match.groupColor,
          })
        })
      })
    }

    void focusMarker()
  }, [params])

  function handleMarkerPinSelect(clickedMarker: MapMarkerItem, groupColor: string) {
    const nearbyMarkers = findNearbyMarkerSelections(
      params.displayMarkerGroups,
      params.visibleMarkerGroupIds,
      clickedMarker,
      params.overlapDistance,
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

    const matchedGroup = params.allMarkerGroups.find((group) =>
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
