import type {
  MarkerGroup,
  MarkerItem,
  MarkerPinStyle,
  PendingMarker
} from "@/features/world/location/application/models/markerGroups"

function fromPendingMarker(
  marker: PendingMarker,
  color: string | null
): MarkerItem {
  return {
    id: marker.id,
    name: marker.name.trim() || "Marcador",
    location: marker.location.trim() || null,
    shortDescription: marker.shortDescription.trim() || null,
    image: marker.image.trim() || null,
    color,
    x: marker.x,
    y: marker.y,
    size: marker.size,
    pinStyle: marker.pinStyle,
    canEdit: true,
    canDelete: true
  }
}

export function createPrivateMarkerGroup(input: {
  id: string
  name: string
  color: string
  pendingMarkers: PendingMarker[]
}): MarkerGroup | null {
  const name = input.name.trim()
  if (!name || input.pendingMarkers.length === 0) return null

  return {
    id: input.id,
    name,
    color: input.color,
    visibility: "private",
    canEdit: true,
    canDelete: true,
    markers: input.pendingMarkers.map((marker) =>
      fromPendingMarker(marker, null)
    )
  }
}

export function appendPendingMarkers(
  group: MarkerGroup,
  pendingMarkers: PendingMarker[]
): MarkerGroup | null {
  if (!group.canEdit || pendingMarkers.length === 0) return null
  return {
    ...group,
    markers: [
      ...group.markers,
      ...pendingMarkers.map((marker) => fromPendingMarker(marker, group.color))
    ]
  }
}

export function updateMarkerGroupDetails(
  group: MarkerGroup,
  input: { name: string; color: string }
): MarkerGroup | null {
  const name = input.name.trim()
  if (!group.canEdit || !name) return null
  return { ...group, name, color: input.color }
}

export function updateMarkerInGroup(
  group: MarkerGroup,
  input: {
    markerId: string
    name: string
    location: string
    shortDescription: string
    image: string
    color: string
    x: number
    y: number
    size: number
    pinStyle: MarkerPinStyle
  }
): MarkerGroup | null {
  const marker = group.markers.find((item) => item.id === input.markerId)
  if (!group.canEdit || !marker || marker.canEdit === false) return null

  return {
    ...group,
    markers: group.markers.map((item) =>
      item.id !== input.markerId
        ? item
        : {
            ...item,
            name: input.name.trim() || item.name,
            location: input.location.trim() || null,
            shortDescription: input.shortDescription.trim() || null,
            image: input.image.trim() || null,
            color: input.color,
            x: input.x,
            y: input.y,
            size: input.size,
            pinStyle: input.pinStyle
          }
    )
  }
}

export type RemoveMarkerResult =
  | { action: "not_allowed" }
  | { action: "delete_group" }
  | { action: "update_group"; group: MarkerGroup }

export function removeMarkerFromGroup(
  group: MarkerGroup,
  markerId: string
): RemoveMarkerResult {
  const marker = group.markers.find((item) => item.id === markerId)
  if (!group.canEdit || !marker || marker.canDelete === false) {
    return { action: "not_allowed" }
  }

  const markers = group.markers.filter((item) => item.id !== markerId)
  return markers.length === 0
    ? { action: "delete_group" }
    : { action: "update_group", group: { ...group, markers } }
}

export function replaceMarkerGroup(
  groups: MarkerGroup[],
  updatedGroup: MarkerGroup
) {
  return groups.map((group) =>
    group.id === updatedGroup.id ? updatedGroup : group
  )
}

export function removeMarkerGroup(groups: MarkerGroup[], groupId: string) {
  return groups.filter((group) => group.id !== groupId)
}
