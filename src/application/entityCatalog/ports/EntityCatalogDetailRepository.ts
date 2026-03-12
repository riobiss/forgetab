import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type {
  EntityCatalogAbilityPurchaseState,
  EntityCatalogCurrentDetail,
  EntityCatalogPlayerItem,
  EntityCatalogTemplateOption,
} from "@/application/entityCatalog/types"
import type { EntityCatalogAbilityView } from "@/application/entityCatalog/use-cases/entityCatalogAbilities"

export type EntityCatalogDetailSnapshot = {
  entityType: CatalogEntityType
  id: string
  key: string
  ownerId: string
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  current: EntityCatalogCurrentDetail
}

export type EntityCatalogDetailRepository = {
  getClassDetail(params: { rpgId: string; classId: string }): Promise<EntityCatalogDetailSnapshot | null>
  getRaceDetail(params: { rpgId: string; raceKey: string }): Promise<EntityCatalogDetailSnapshot | null>
  listAttributeTemplates(rpgId: string): Promise<EntityCatalogTemplateOption[]>
  listSkillTemplates(rpgId: string): Promise<EntityCatalogTemplateOption[]>
  listClassAbilities(classTemplateId: string): Promise<EntityCatalogAbilityView[]>
  listRaceAbilities(raceTemplateId: string): Promise<EntityCatalogAbilityView[]>
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
  getClassPurchaseState(params: {
    rpgId: string
    userId: string
    classKey: string
    costsEnabled: boolean
    costResourceName: string
  }): Promise<EntityCatalogAbilityPurchaseState>
  getRacePurchaseState(params: {
    rpgId: string
    userId: string
    raceKey: string
  }): Promise<EntityCatalogAbilityPurchaseState>
}
