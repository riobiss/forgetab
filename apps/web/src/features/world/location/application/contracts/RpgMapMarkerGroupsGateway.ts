import type {
  RpgMapMarkerGroupDto,
  UpsertRpgMapMarkerGroupPayloadDto
} from "@forgetab/world-contracts/location"

export interface RpgMapMarkerGroupsGateway {
  createMarkerGroup(
    rpgId: string,
    mapId: string,
    payload: UpsertRpgMapMarkerGroupPayloadDto
  ): Promise<RpgMapMarkerGroupDto>
  updateMarkerGroup(
    rpgId: string,
    mapId: string,
    groupId: string,
    payload: UpsertRpgMapMarkerGroupPayloadDto
  ): Promise<RpgMapMarkerGroupDto>
  deleteMarkerGroup(
    rpgId: string,
    mapId: string,
    groupId: string
  ): Promise<void>
}
