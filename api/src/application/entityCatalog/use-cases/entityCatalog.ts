import { getCatalogMetaExcerpt, getCatalogMetaSearchText } from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogFilters, EntityCatalogGroup, EntityCatalogItem, EntityCatalogPageData, EntityCatalogSort } from "@/application/entityCatalog/types"
import type { EntityCatalogRepository } from "@/application/entityCatalog/ports/EntityCatalogRepository"

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
}

export async function loadEntityCatalogPageData(
  repository: EntityCatalogRepository,
  params: {
    rpgId: string
    userId: string | null
    entityType: CatalogEntityType
  },
): Promise<EntityCatalogPageData | null> {
  const access = await repository.getAccessSnapshot({
    rpgId: params.rpgId,
    userId: params.userId,
  })

  if (!access.exists || !access.canRead) {
    return null
  }

  const items = await repository.listItems({
    rpgId: params.rpgId,
    entityType: params.entityType,
    canManage: access.canManage,
  })

  return {
    canManage: access.canManage,
    items: items.map((item) => ({
      ...item,
      entityType: params.entityType,
    })),
  }
}

export function searchCatalogItems(items: EntityCatalogItem[], search: string) {
  const normalizedSearch = normalizeText(search)
  if (!normalizedSearch) return items

  return items.filter((item) => {
    const haystack = normalizeText(
      [
        item.name,
        item.slug,
        item.category,
        getCatalogMetaExcerpt(item.meta) ?? "",
        getCatalogMetaSearchText(item.meta),
      ].join(" "),
    )

    return haystack.includes(normalizedSearch)
  })
}

export function filterCatalogItemsByCategory(items: EntityCatalogItem[], category: string) {
  if (!category || category === "all") return items
  return items.filter((item) => item.category === category)
}

export function sortCatalogItems(items: EntityCatalogItem[], sort: EntityCatalogSort) {
  const sorted = [...items]
  sorted.sort((left, right) => {
    switch (sort) {
      case "name-desc":
        return right.name.localeCompare(left.name, "pt-BR")
      case "slug-asc":
        return left.slug.localeCompare(right.slug, "pt-BR")
      case "slug-desc":
        return right.slug.localeCompare(left.slug, "pt-BR")
      case "category-asc":
        return (
          left.category.localeCompare(right.category, "pt-BR") ||
          left.name.localeCompare(right.name, "pt-BR")
        )
      case "name-asc":
      default:
        return left.name.localeCompare(right.name, "pt-BR")
    }
  })
  return sorted
}

export function groupCatalogItems(items: EntityCatalogItem[]): EntityCatalogGroup[] {
  const groups = items.reduce<Map<string, EntityCatalogItem[]>>((acc, item) => {
    const key = item.category?.trim() || "geral"
    const current = acc.get(key) ?? []
    current.push(item)
    acc.set(key, current)
    return acc
  }, new Map())

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "pt-BR"))
    .map(([key, groupItems]) => ({
      key,
      label: key,
      count: groupItems.length,
      items: groupItems,
    }))
}

export function buildEntityCatalogGroups(
  items: EntityCatalogItem[],
  filters: EntityCatalogFilters,
) {
  return groupCatalogItems(
    sortCatalogItems(
      filterCatalogItemsByCategory(searchCatalogItems(items, filters.search), filters.category),
      filters.sort,
    ),
  )
}

export function getEntityCatalogCategoryOptions(items: EntityCatalogItem[]) {
  return [...new Set(items.map((item) => item.category).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "pt-BR"),
  )
}
