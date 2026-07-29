import type {
  RpgMapMarkerGroupDto,
  UpsertRpgMapMarkerItemPayloadDto,
} from "@/features/world/location/application/types"

export interface RpgMapMarkerGroupsRepository {
  listMarkerGroups(
    rpgId: string,
    mapId: string,
  ): Promise<RpgMapMarkerGroupDto[]>
  findMarkerGroup(params: {
    rpgId: string
    mapId: string
    groupId: string
  }): Promise<RpgMapMarkerGroupDto | null>
  createMarkerGroup(params: {
    rpgId: string
    mapId: string
    userId: string
    name: string
    color: string
    markers: UpsertRpgMapMarkerItemPayloadDto[]
  }): Promise<RpgMapMarkerGroupDto>
  updateMarkerGroup(params: {
    rpgId: string
    mapId: string
    groupId: string
    name: string
    color: string
    markers: UpsertRpgMapMarkerItemPayloadDto[]
  }): Promise<RpgMapMarkerGroupDto | null>
  deleteMarkerGroup(params: {
    rpgId: string
    mapId: string
    groupId: string
  }): Promise<boolean>
  findMarkerGroupOwner(params: {
    rpgId: string
    mapId: string
    groupId: string
  }): Promise<{ createdByUserId: string | null } | null>
}
