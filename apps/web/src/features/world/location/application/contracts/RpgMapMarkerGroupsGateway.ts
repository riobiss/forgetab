import type {
  RpgMapMarkerGroupDto,
  UpsertRpgMapMarkerGroupPayloadDto,
} from "@/features/world/location/application/types"

export interface RpgMapMarkerGroupsGateway {
  createMarkerGroup(
    rpgId: string,
    mapId: string,
    payload: UpsertRpgMapMarkerGroupPayloadDto,
  ): Promise<RpgMapMarkerGroupDto>
  updateMarkerGroup(
    rpgId: string,
    mapId: string,
    groupId: string,
    payload: UpsertRpgMapMarkerGroupPayloadDto,
  ): Promise<RpgMapMarkerGroupDto>
  deleteMarkerGroup(
    rpgId: string,
    mapId: string,
    groupId: string,
  ): Promise<void>
}
