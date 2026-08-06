import type { MarkerSectionSyncGateway } from "@/features/world/location/application/contracts/MarkerSectionSyncGateway"
import {
  MARKER_STORAGE_PREFIX,
  MARKER_STORAGE_UPDATED_EVENT
} from "@/features/world/location/infrastructure/storage/privateMarkerStorageKeys"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export const localPrivateMarkerSectionSyncGateway: MarkerSectionSyncGateway = {
  async update(params) {
    const storageKey = `${MARKER_STORAGE_PREFIX}${params.mapId}`
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]")
    const groups = Array.isArray(parsed) ? parsed : []

    const nextGroups = groups.map((groupValue) => {
      const group = asRecord(groupValue)
      if (!group || String(group.id) !== params.groupId) return groupValue

      const markers = Array.isArray(group.markers) ? group.markers : []
      return {
        ...group,
        markers: markers.map((markerValue) => {
          const marker = asRecord(markerValue)
          if (!marker || String(marker.id) !== params.markerId) {
            return markerValue
          }
          return {
            ...marker,
            ...params.update
          }
        })
      }
    })

    window.localStorage.setItem(storageKey, JSON.stringify(nextGroups))
    window.dispatchEvent(
      new CustomEvent(MARKER_STORAGE_UPDATED_EVENT, {
        detail: { mapId: params.mapId }
      })
    )
  }
}
