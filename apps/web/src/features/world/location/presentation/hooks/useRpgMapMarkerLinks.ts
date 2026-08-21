"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type { RpgMapDetailViewDto } from "@forgetab/world-contracts/location"
import {
  buildLinkedSectionSnapshots,
  buildMarkerOptions,
  type MarkerLinkOption
} from "@/features/world/location/presentation/utils/sectionMarkerLinking"

export function useRpgMapMarkerLinks(
  detail: RpgMapDetailViewDto | null,
  privateMarkerOptions: MarkerLinkOption[]
) {
  const mapFeatureRef = useRef<HTMLDivElement | null>(null)
  const [focusMarkerRequest, setFocusMarkerRequest] = useState<{
    markerId: string
    token: number
  } | null>(null)

  const markerOptions = useMemo(() => {
    const publicOptions = buildMarkerOptions(detail)
    const seen = new Set<string>()
    return [...publicOptions, ...privateMarkerOptions].filter((marker) => {
      if (seen.has(marker.id)) {
        return false
      }
      seen.add(marker.id)
      return true
    })
  }, [detail, privateMarkerOptions])

  const linkedSectionSnapshots = useMemo(
    () => buildLinkedSectionSnapshots(detail?.sections ?? []),
    [detail?.sections]
  )
  const markerSectionOptions = useMemo(
    () =>
      (detail?.sections ?? []).map((section) => ({
        id: section.id,
        name: section.name
      })),
    [detail?.sections]
  )
  const markerLinkSelectOptions = useMemo(
    () =>
      markerOptions.map((marker) => ({
        id: marker.id,
        name: marker.name
      })),
    [markerOptions]
  )

  const focusMarker = useCallback(
    (markerId: string, beforeFocus?: () => void) => {
      beforeFocus?.()
      mapFeatureRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
      setFocusMarkerRequest((current) => ({
        markerId,
        token: (current?.token ?? 0) + 1
      }))
    },
    []
  )

  return {
    canEditMapContent: Boolean(detail),
    canManageMapImage: Boolean(detail?.canManage || detail?.map.canEdit),
    canManagePublicMarkers: Boolean(detail?.canManage),
    focusMarker,
    focusMarkerRequest,
    linkedSectionSnapshots,
    mapFeatureRef,
    markerLinkSelectOptions,
    markerOptions,
    markerSectionOptions
  }
}
