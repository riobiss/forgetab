import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogPageData } from "@/features/world/catalog/application/types"
import type { EntityCatalogPageAccessService } from "@/features/world/catalog/application/ports/EntityCatalogPageAccessService"
import type { EntityCatalogRepository } from "@/features/world/catalog/application/ports/EntityCatalogRepository"

export async function loadEntityCatalogPageData(
  deps: {
    repository: EntityCatalogRepository
    accessService: EntityCatalogPageAccessService
  },
  params: {
    rpgId: string
    userId: string | null
    entityType: CatalogEntityType
  },
): Promise<EntityCatalogPageData | null> {
  const access = await deps.accessService.getAccess({
    rpgId: params.rpgId,
    userId: params.userId,
  })

  if (!access.exists || !access.canRead) {
    return null
  }

  const items = await deps.repository.listItems({
    rpgId: params.rpgId,
    entityType: params.entityType,
  })

  return {
    canManage: access.canManage,
    items: items.map((item) => {
      const href =
        params.entityType === "class"
          ? `/rpg/${params.rpgId}/classes/${item.id}`
          : `/rpg/${params.rpgId}/races/${item.slug}`

      return {
        ...item,
        href,
        entityType: params.entityType,
      }
    }),
  }
}
