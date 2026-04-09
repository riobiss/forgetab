import type { RpgCatalogRepository } from "@/application/rpgCatalog/ports/RpgCatalogRepository"
import type { RpgCatalogData, RpgCatalogItem } from "@/application/rpgCatalog/types"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

type RpgCatalogApiItem = Omit<RpgCatalogItem, "createdAt"> & {
  createdAt: string
}

type RpgCatalogApiResponse = Omit<RpgCatalogData, "createdRpgs" | "publicRpgs"> & {
  createdRpgs: RpgCatalogApiItem[]
  publicRpgs: RpgCatalogApiItem[]
}

function toCatalogItem(item: RpgCatalogApiItem): RpgCatalogItem {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro ao carregar catalogo de RPGs.")
  }
  return payload
}

export const httpRpgCatalogRepository: RpgCatalogRepository = {
  async listOwnedByUser() {
    const payload = await fetchCatalog()
    return payload.createdRpgs
  },

  async listPublicExcludingUser() {
    const payload = await fetchCatalog()
    return payload.publicRpgs
  },
}

export function createHttpRpgCatalogRepository(): RpgCatalogRepository {
  let catalogPromise: Promise<RpgCatalogData> | null = null

  async function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetchCatalog()
    }

    return catalogPromise
  }

  return {
    async listOwnedByUser() {
      const payload = await loadCatalog()
      return payload.createdRpgs
    },

    async listPublicExcludingUser() {
      const payload = await loadCatalog()
      return payload.publicRpgs
    },
  }
}

async function fetchCatalog(): Promise<RpgCatalogData> {
  const response = await apiFetch("/api/rpg", {
    next: { revalidate: 0 },
    cache: "no-store",
  })
  const payload = await parseJsonResponse<RpgCatalogApiResponse>(response)

  return {
    userId: payload.userId,
    createdRpgs: payload.createdRpgs.map(toCatalogItem),
    publicRpgs: payload.publicRpgs.map(toCatalogItem),
  }
}
