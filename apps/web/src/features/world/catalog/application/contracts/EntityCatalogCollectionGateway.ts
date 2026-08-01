import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogTemplateRecord } from "@/features/world/catalog/application/types"

export interface EntityCatalogCollectionGateway {
  fetchCollection(
    rpgId: string,
    entityType: CatalogEntityType,
  ): Promise<EntityCatalogTemplateRecord[]>
  saveCollection(
    rpgId: string,
    entityType: CatalogEntityType,
    collection: EntityCatalogTemplateRecord[],
  ): Promise<void>
}
