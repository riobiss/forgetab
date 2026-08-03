import type {
  RpgMapDetailViewDto,
  RpgMapDto,
  UpsertRpgMapPayloadDto,
} from "@forgetab/world-contracts/location"

export interface RpgMapsGateway {
  fetchMaps(rpgId: string): Promise<{
    maps: RpgMapDto[]
    canManage: boolean
  }>
  fetchMap(rpgId: string, mapId: string): Promise<RpgMapDetailViewDto>
  createMap(
    rpgId: string,
    payload: UpsertRpgMapPayloadDto,
  ): Promise<RpgMapDto>
  updateMap(
    rpgId: string,
    mapId: string,
    payload: UpsertRpgMapPayloadDto,
  ): Promise<RpgMapDto>
  deleteMap(rpgId: string, mapId: string): Promise<void>
}
