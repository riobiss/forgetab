import type { EntityCatalogPlayerItem } from "@/features/world/catalog/application/types"

export interface EntityCatalogPlayerRepository {
  listClassPlayers(params: {
    rpgId: string
    classKey: string
    classId: string
    userId: string | null
    isOwner: boolean
  }): Promise<EntityCatalogPlayerItem[]>
  listRacePlayers(params: {
    rpgId: string
    raceKey: string
    userId: string | null
    isOwner: boolean
  }): Promise<EntityCatalogPlayerItem[]>
}
