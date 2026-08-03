import type { RpgMapMarkerGroupsGateway } from "@/features/world/location/application/contracts/RpgMapMarkerGroupsGateway"
import type { UpsertRpgMapMarkerGroupPayloadDto } from "@forgetab/world-contracts/location"

export function createRpgMapMarkerGroupUseCase(
  gateway: RpgMapMarkerGroupsGateway,
  params: {
    rpgId: string
    mapId: string
    payload: UpsertRpgMapMarkerGroupPayloadDto
  },
) {
  return gateway.createMarkerGroup(params.rpgId, params.mapId, params.payload)
}

export function updateRpgMapMarkerGroupUseCase(
  gateway: RpgMapMarkerGroupsGateway,
  params: {
    rpgId: string
    mapId: string
    groupId: string
    payload: UpsertRpgMapMarkerGroupPayloadDto
  },
) {
  return gateway.updateMarkerGroup(
    params.rpgId,
    params.mapId,
    params.groupId,
    params.payload,
  )
}

export function deleteRpgMapMarkerGroupUseCase(
  gateway: RpgMapMarkerGroupsGateway,
  params: { rpgId: string; mapId: string; groupId: string },
) {
  return gateway.deleteMarkerGroup(params.rpgId, params.mapId, params.groupId)
}
