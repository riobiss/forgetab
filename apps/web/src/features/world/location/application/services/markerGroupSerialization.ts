import type { MarkerGroup } from "@/features/world/location/application/models/markerGroups"
import type {
  RpgMapMarkerGroupDto,
  UpsertRpgMapMarkerGroupPayloadDto,
} from "@forgetab/world-contracts/location"

const DEFAULT_MARKER_SIZE = 1
const DEFAULT_MARKER_PIN_STYLE = "default"

export function toMarkerGroupPayload(
  group: MarkerGroup,
): UpsertRpgMapMarkerGroupPayloadDto {
  return {
    name: group.name,
    color: group.color,
    markers: group.markers.map((marker) => ({
      id: marker.id,
      name: marker.name,
      location: marker.location,
      shortDescription: marker.shortDescription,
      image: marker.image,
      color: marker.color ?? null,
      x: marker.x,
      y: marker.y,
      size: marker.size ?? DEFAULT_MARKER_SIZE,
      pinStyle: marker.pinStyle ?? DEFAULT_MARKER_PIN_STYLE,
    })),
  }
}

export function fromPublicMarkerGroupDto(
  group: RpgMapMarkerGroupDto,
): MarkerGroup {
  return {
    id: group.id,
    name: group.name,
    color: group.color,
    visibility: "public",
    canEdit: group.canEdit ?? false,
    canDelete: group.canDelete ?? false,
    markers: group.markers.map((marker) => ({
      id: marker.id,
      name: marker.name,
      location: marker.location,
      shortDescription: marker.shortDescription,
      image: marker.image,
      color: marker.color,
      x: marker.x,
      y: marker.y,
      size: marker.size ?? DEFAULT_MARKER_SIZE,
      pinStyle: marker.pinStyle === "label" ? "label" : "default",
      canEdit: marker.canEdit ?? false,
      canDelete: marker.canDelete ?? false,
    })),
  }
}
