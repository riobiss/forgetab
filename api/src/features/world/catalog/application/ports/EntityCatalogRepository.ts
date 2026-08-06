import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogMeta } from "@/features/world/catalog/domain/types"

export interface EntityCatalogRepository {
  listItems(params: { rpgId: string; entityType: CatalogEntityType }): Promise<
    Array<{
      id: string
      slug: string
      name: string
      category: string
      meta: EntityCatalogMeta
    }>
  >
}
