import type { EntityCatalogTemplateRecord } from "@/features/world/catalog/application/types"

export type EntityCatalogCategoryItemDraft = {
  identity: string
  label: string
}

export function getEntityCatalogTemplateCategory(
  item: EntityCatalogTemplateRecord,
) {
  return typeof item.category === "string" && item.category.trim().length > 0
    ? item.category.trim()
    : "geral"
}

function getTemplateIdentity(
  item: EntityCatalogTemplateRecord,
  index: number,
) {
  if (typeof item.id === "string" && item.id.trim()) return `id:${item.id}`
  if (typeof item.key === "string" && item.key.trim()) return `key:${item.key}`
  return `index:${index}`
}

export function getEntityCatalogCategoryDrafts(
  collection: EntityCatalogTemplateRecord[],
  category: string,
): EntityCatalogCategoryItemDraft[] {
  return collection.flatMap((item, index) =>
    getEntityCatalogTemplateCategory(item) === category
      ? [
          {
            identity: getTemplateIdentity(item, index),
            label: typeof item.label === "string" ? item.label : "",
          },
        ]
      : [],
  )
}

export function updateEntityCatalogCategory(
  collection: EntityCatalogTemplateRecord[],
  params: {
    currentCategory: string
    nextCategory: string
    items: EntityCatalogCategoryItemDraft[]
  },
) {
  const nextCategory = params.nextCategory.trim() || params.currentCategory
  const draftsByIdentity = new Map(
    params.items.map((item) => [item.identity, item]),
  )

  return collection.reduce<EntityCatalogTemplateRecord[]>(
    (result, item, index) => {
      if (
        getEntityCatalogTemplateCategory(item) !== params.currentCategory
      ) {
        result.push(item)
        return result
      }

      const draft = draftsByIdentity.get(getTemplateIdentity(item, index))
      if (draft) {
        result.push({
          ...item,
          label: draft.label.trim() || item.label,
          category: nextCategory,
        })
      }
      return result
    },
    [],
  )
}

export function deleteEntityCatalogCategory(
  collection: EntityCatalogTemplateRecord[],
  category: string,
) {
  return collection.filter(
    (item) => getEntityCatalogTemplateCategory(item) !== category,
  )
}
