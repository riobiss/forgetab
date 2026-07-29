import type { RpgMapsGateway } from "@/features/world/location/application/contracts/RpgMapsGateway"
import type { UpsertRpgMapPayloadDto } from "@/features/world/location/application/types"

export function loadRpgMapsUseCase(
  gateway: RpgMapsGateway,
  params: { rpgId: string },
) {
  return gateway.fetchMaps(params.rpgId)
}

export function loadRpgMapDetailUseCase(
  gateway: RpgMapsGateway,
  params: { rpgId: string; mapId: string },
) {
  return gateway.fetchMap(params.rpgId, params.mapId)
}

export function createRpgMapUseCase(
  gateway: RpgMapsGateway,
  params: { rpgId: string; payload: UpsertRpgMapPayloadDto },
) {
  return gateway.createMap(params.rpgId, params.payload)
}

export function updateRpgMapUseCase(
  gateway: RpgMapsGateway,
  params: {
    rpgId: string
    mapId: string
    payload: UpsertRpgMapPayloadDto
  },
) {
  return gateway.updateMap(params.rpgId, params.mapId, params.payload)
}

export function deleteRpgMapUseCase(
  gateway: RpgMapsGateway,
  params: { rpgId: string; mapId: string },
) {
  return gateway.deleteMap(params.rpgId, params.mapId)
}
