import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type {
  EntityCatalogAbilityPurchaseResult,
  EntityCatalogTemplateRecord,
} from "@/features/world/catalog/application/types"

export type EntityCatalogGateway = {
  fetchCollection(
    rpgId: string,
    entityType: CatalogEntityType,
  ): Promise<EntityCatalogTemplateRecord[]>
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
