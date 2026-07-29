"use client"

import { useEffect, useState } from "react"
import { rpgMapPresentationDeps } from "@/features/world/location/presentation/dependencies"
import type { MarkerLinkOption } from "@/features/world/location/presentation/utils/sectionMarkerLinking"

export function usePrivateMarkerOptions(
  mapId: string | null,
  markerColors: string[],
) {
  const [options, setOptions] = useState<MarkerLinkOption[]>([])

  useEffect(() => {
    if (!mapId) {
      setOptions([])
      return
    }
    const selectedMapId = mapId

    function loadOptions() {
      try {
        const groups =
          rpgMapPresentationDeps.privateMarkerGroupStorage.load(
            selectedMapId,
            markerColors,
          )
        setOptions(
          groups.flatMap((group) =>
            group.markers.map((marker) => ({
              id: marker.id,
              groupId: group.id,
              visibility: "private" as const,
              name: marker.name,
              location: marker.location ?? null,
              shortDescription: marker.shortDescription ?? null,
              image: marker.image ?? null,
              color: marker.color || group.color,
              size: marker.size ?? null,
              pinStyle: marker.pinStyle ?? "default",
            })),
          ),
        )
      } catch {
        setOptions([])
      }
    }

    loadOptions()
    return rpgMapPresentationDeps.privateMarkerGroupStorage.subscribe(
      mapId,
      loadOptions,
    )
  }, [mapId, markerColors])

  return options
}
