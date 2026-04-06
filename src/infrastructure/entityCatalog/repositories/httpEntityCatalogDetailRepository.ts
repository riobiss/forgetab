import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogDetailData } from "@/application/entityCatalog/types"
import { apiFetch } from "@/infrastructure/http/apiFetch"
import { HttpEntityCatalogError } from "@/infrastructure/entityCatalog/repositories/httpEntityCatalogPageRepository"

export { HttpEntityCatalogError } from "@/infrastructure/entityCatalog/repositories/httpEntityCatalogPageRepository"

type ErrorPayload = {
  message?: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new HttpEntityCatalogError(
      payload.message ?? "Erro ao carregar detalhe da entidade.",
      response.status,
    )
  }
  return payload
}

export async function fetchEntityCatalogDetailData(
  rpgId: string,
  entityType: CatalogEntityType,
  entityId: string,
): Promise<EntityCatalogDetailData> {
  const segment = entityType === "class" ? "classes" : "races"
  const response = await apiFetch(`/api/rpg/${rpgId}/entity-catalog/${segment}/${entityId}`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })

  return parseJsonResponse<EntityCatalogDetailData>(response)
}
