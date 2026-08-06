import type { MarkerGroup } from "@/features/world/location/application/models/markerGroups"
import type { RpgMapMarkerGroupsGateway } from "@/features/world/location/application/contracts/RpgMapMarkerGroupsGateway"
import {
  fromPublicMarkerGroupDto,
  toMarkerGroupPayload
} from "@/features/world/location/application/services/markerGroupSerialization"

export async function savePublicMarkerGroupUseCase(
  gateway: RpgMapMarkerGroupsGateway,
  params: {
    rpgId: string
    mapId: string
    group: MarkerGroup
  }
) {
  const payload = toMarkerGroupPayload(params.group)
  const saved =
    params.group.visibility === "public"
      ? await gateway.updateMarkerGroup(
          params.rpgId,
          params.mapId,
          params.group.id,
          payload
        )
      : await gateway.createMarkerGroup(params.rpgId, params.mapId, payload)

  return fromPublicMarkerGroupDto(saved)
}
