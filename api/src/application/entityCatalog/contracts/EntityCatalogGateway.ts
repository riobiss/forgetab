import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type {
  EntityCatalogAbilityPurchaseResult,
  EntityCatalogTemplateRecord,
} from "@/application/entityCatalog/types"

export type EntityCatalogGateway = {
  fetchCollection(rpgId: string, entityType: CatalogEntityType): Promise<EntityCatalogTemplateRecord[]>
  saveCollection(
    rpgId: string,
    entityType: CatalogEntityType,
    collection: EntityCatalogTemplateRecord[],
  ): Promise<void>
  buySkill(
    characterId: string,
    payload: { skillId: string; level: number },
  ): Promise<EntityCatalogAbilityPurchaseResult>
}
