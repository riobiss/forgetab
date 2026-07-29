import type { RpgMapDto } from "@/features/world/location/application/types"

export interface RpgMapsRepository {
  listMaps(rpgId: string): Promise<RpgMapDto[]>
  findMap(rpgId: string, mapId: string): Promise<RpgMapDto | null>
  createMap(params: {
    rpgId: string
    userId: string
    title: string
    description: string | null
    type: string | null
    image: string | null
  }): Promise<RpgMapDto>
  updateMap(params: {
    rpgId: string
    mapId: string
    title: string
    description: string | null
    type: string | null
    image: string | null
  }): Promise<RpgMapDto | null>
  deleteMap(rpgId: string, mapId: string): Promise<boolean>
  findMapOwner(params: {
    rpgId: string
    mapId: string
  }): Promise<{ createdByUserId: string | null } | null>
}
