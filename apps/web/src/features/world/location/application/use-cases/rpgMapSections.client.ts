import type { RpgMapSectionsGateway } from "@/features/world/location/application/contracts/RpgMapSectionsGateway"
import type { UpsertRpgMapSectionPayloadDto } from "@forgetab/world-contracts/location"

export function createRpgMapSectionUseCase(
  gateway: RpgMapSectionsGateway,
  params: {
    rpgId: string
    mapId: string
    payload: UpsertRpgMapSectionPayloadDto
  }
) {
  return gateway.createSection(params.rpgId, params.mapId, params.payload)
}

export function updateRpgMapSectionUseCase(
  gateway: RpgMapSectionsGateway,
  params: {
    rpgId: string
    mapId: string
    sectionId: string
    payload: UpsertRpgMapSectionPayloadDto
  }
) {
  return gateway.updateSection(
    params.rpgId,
    params.mapId,
    params.sectionId,
    params.payload
  )
}

export function deleteRpgMapSectionUseCase(
  gateway: RpgMapSectionsGateway,
  params: { rpgId: string; mapId: string; sectionId: string }
) {
  return gateway.deleteSection(params.rpgId, params.mapId, params.sectionId)
}

export function reorderRpgMapSectionUseCase(
  gateway: RpgMapSectionsGateway,
  params: {
    rpgId: string
    mapId: string
    sectionId: string
    direction: "up" | "down"
  }
) {
  return gateway.reorderSection(
    params.rpgId,
    params.mapId,
    params.sectionId,
    params.direction
  )
}
