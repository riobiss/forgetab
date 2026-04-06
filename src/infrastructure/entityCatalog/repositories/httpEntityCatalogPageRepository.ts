import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogPageData } from "@/application/entityCatalog/types"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

export class HttpEntityCatalogError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpEntityCatalogError"
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new HttpEntityCatalogError(
      payload.message ?? "Erro ao carregar catalogo de entidades.",
      response.status,
    )
  }
  return payload
}

export async function fetchEntityCatalogPageData(
  rpgId: string,
  entityType: CatalogEntityType,
): Promise<EntityCatalogPageData> {
  const segment = entityType === "class" ? "classes" : "races"
  const response = await apiFetch(`/api/rpg/${rpgId}/entity-catalog/${segment}`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })

  return parseJsonResponse<EntityCatalogPageData>(response)
}
