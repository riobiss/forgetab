import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogMeta } from "@/domain/entityCatalog/types"

export interface EntityCatalogRepository {
  getAccessSnapshot(params: {
    rpgId: string
    userId: string | null
  }): Promise<{
    exists: boolean
    canRead: boolean
    canManage: boolean
  }>
  listItems(params: {
    rpgId: string
    entityType: CatalogEntityType
    canManage: boolean
  }): Promise<
    Array<{
      id: string
      slug: string
      name: string
      category: string
      meta: EntityCatalogMeta
      href: string
      editHref?: string
    }>
  >
}

