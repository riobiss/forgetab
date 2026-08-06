import type { RpgCatalogRepository } from "@forgetab/world-contracts/catalog"
import type {
  RpgCatalogData,
  RpgCatalogItem
} from "@forgetab/world-contracts/catalog"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { createApiResponseParser } from "@/features/http/infrastructure/parseApiResponse"

type RpgCatalogApiItem = Omit<RpgCatalogItem, "createdAt"> & {
  createdAt: string
}

type RpgCatalogApiResponse = Omit<
  RpgCatalogData,
  "createdRpgs" | "publicRpgs"
> & {
  createdRpgs: RpgCatalogApiItem[]
  publicRpgs: RpgCatalogApiItem[]
}

function toCatalogItem(item: RpgCatalogApiItem): RpgCatalogItem {
  return {
    ...item,
    createdAt: new Date(item.createdAt)
  }
}

const parseJsonResponse = createApiResponseParser({
  fallbackMessage: "Erro ao carregar catalogo de RPGs."
})

export const httpRpgCatalogRepository: RpgCatalogRepository = {
  async listOwnedByUser() {
    const payload = await fetchCatalog()
    return payload.createdRpgs
  },

  async listPublicExcludingUser() {
    const payload = await fetchCatalog()
    return payload.publicRpgs
  }
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
    }
  }
}

async function fetchCatalog(): Promise<RpgCatalogData> {
  const response = await apiFetch("/api/rpg", {
    next: { revalidate: 0 },
    cache: "no-store"
  })
  const payload = await parseJsonResponse<RpgCatalogApiResponse>(response)

  return {
    userId: payload.userId,
    createdRpgs: payload.createdRpgs.map(toCatalogItem),
    publicRpgs: payload.publicRpgs.map(toCatalogItem)
  }
}
