import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogPageData } from "@/features/world/catalog/application/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import {
  HttpEntityCatalogError,
  parseEntityCatalogResponse
} from "@/features/world/catalog/infrastructure/http/entityCatalogHttp"

export { HttpEntityCatalogError }

export async function fetchEntityCatalogPageData(
  rpgId: string,
  entityType: CatalogEntityType
): Promise<EntityCatalogPageData> {
  const segment = entityType === "class" ? "classes" : "races"
  const response = await apiFetch(
    `/api/rpg/${rpgId}/entity-catalog/${segment}`,
    {
      next: { revalidate: 0 },
      cache: "no-store"
    }
  )

  return parseEntityCatalogResponse<EntityCatalogPageData>(
    response,
    "Erro ao carregar catalogo de entidades."
  )
}
