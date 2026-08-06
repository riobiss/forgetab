import type { PrivateMarkerGroupStorage } from "@/features/world/location/application/contracts/PrivateMarkerGroupStorage"
import type { MarkerGroup } from "@/features/world/location/application/models/markerGroups"
import {
  MARKER_STORAGE_PREFIX,
  MARKER_STORAGE_UPDATED_EVENT
} from "./privateMarkerStorageKeys"

const DEFAULT_MARKER_SIZE = 1

function parseGroups(
  raw: string | null,
  markerColors: string[]
): MarkerGroup[] {
  if (!raw) return []
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) return []

  return parsed
    .filter((value): value is Record<string, unknown> =>
      Boolean(value && typeof value === "object")
    )
    .map((group) => ({
      id: String(group.id),
      name: String(group.name ?? "Marcadores"),
      color:
        typeof group.color === "string"
          ? group.color
          : (markerColors[0] ?? "#f97316"),
      visibility: "private" as const,
      canEdit: true,
      canDelete: true,
      markers: Array.isArray(group.markers)
        ? group.markers
            .filter((marker): marker is Record<string, unknown> =>
              Boolean(marker && typeof marker === "object")
            )
            .map((marker) => ({
              id: String(marker.id),
              name: String(marker.name ?? "Marcador"),
              location:
                typeof marker.location === "string" ? marker.location : null,
              shortDescription:
                typeof marker.shortDescription === "string"
                  ? marker.shortDescription
                  : null,
              image: typeof marker.image === "string" ? marker.image : null,
              x: Number(marker.x ?? 0),
              y: Number(marker.y ?? 0),
              color: typeof marker.color === "string" ? marker.color : null,
              size:
                typeof marker.size === "number"
                  ? marker.size
                  : DEFAULT_MARKER_SIZE,
              pinStyle: marker.pinStyle === "label" ? "label" : "default",
              canEdit: true,
              canDelete: true
            }))
        : []
    }))
}

export const localPrivateMarkerGroupStorage: PrivateMarkerGroupStorage = {
  load(mapId, markerColors) {
    return parseGroups(
      window.localStorage.getItem(`${MARKER_STORAGE_PREFIX}${mapId}`),
      markerColors
    )
  },

  save(mapId, groups, options) {
    window.localStorage.setItem(
      `${MARKER_STORAGE_PREFIX}${mapId}`,
      JSON.stringify(groups)
    )
    if (options?.notify === false) return
    window.dispatchEvent(
      new CustomEvent(MARKER_STORAGE_UPDATED_EVENT, {
        detail: { mapId }
      })
    )
  },

  subscribe(mapId, onChange) {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<{ mapId?: string }>
      if (customEvent.detail?.mapId === mapId) onChange()
    }
    window.addEventListener(MARKER_STORAGE_UPDATED_EVENT, listener)
    return () =>
      window.removeEventListener(MARKER_STORAGE_UPDATED_EVENT, listener)
  }
}
