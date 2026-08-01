import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogDetailData } from "@/features/world/catalog/application/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import {
  HttpEntityCatalogError,
  parseEntityCatalogResponse,
} from "@/features/world/catalog/infrastructure/http/entityCatalogHttp"

export { HttpEntityCatalogError }

export async function fetchEntityCatalogDetailData(
  rpgId: string,
  entityType: CatalogEntityType,
  entityId: string,
): Promise<EntityCatalogDetailData> {
  const segment = entityType === "class" ? "classes" : "races"
  const response = await apiFetch(
    `/api/rpg/${rpgId}/entity-catalog/${segment}/${entityId}`,
    {
      next: { revalidate: 0 },
      cache: "no-store",
    },
  )

  return parseEntityCatalogResponse<EntityCatalogDetailData>(
    response,
    "Erro ao carregar detalhe da entidade.",
  )
}
