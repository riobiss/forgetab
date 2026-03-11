import type { CatalogEntityType, EntityCatalogMeta } from "@/domain/entityCatalog/types"

export type EntityCatalogItem = {
  id: string
  slug: string
  name: string
  category: string
  meta: EntityCatalogMeta
  href: string
  editHref?: string
  entityType: CatalogEntityType
}

export type EntityCatalogSort =
  | "name-asc"
  | "name-desc"
  | "slug-asc"
  | "slug-desc"
  | "category-asc"

export type EntityCatalogFilters = {
  search: string
  category: string
  sort: EntityCatalogSort
}

export type EntityCatalogGroup = {
  key: string
  label: string
  count: number
  items: EntityCatalogItem[]
}

export type EntityCatalogPageData = {
  canManage: boolean
  items: EntityCatalogItem[]
}

export type EntityCatalogPlayerItem = {
  id: string
  name: string
  image: string | null
  classKey: string | null
  raceKey: string | null
}
