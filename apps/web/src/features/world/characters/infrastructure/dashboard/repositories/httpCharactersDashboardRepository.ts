import type { CharactersDashboardViewModel } from "@/features/world/characters/application/dashboard/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { createApiResponseParser } from "@/features/http/infrastructure/parseApiResponse"

export class HttpCharactersDashboardError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpCharactersDashboardError"
  }
}

const parseJsonResponse = createApiResponseParser({
  fallbackMessage: "Erro ao carregar dashboard de personagens.",
  errorFactory: (message, status) =>
    new HttpCharactersDashboardError(message, status),
})

export async function fetchCharactersDashboardViewModel(
  rpgId: string,
  searchParams: {
    type?: string
    modal?: string
    viewer?: string
    characterId?: string
  },
): Promise<CharactersDashboardViewModel> {
  const query = new URLSearchParams()

  if (searchParams.type) query.set("type", searchParams.type)
  if (searchParams.modal) query.set("modal", searchParams.modal)
  if (searchParams.viewer) query.set("viewer", searchParams.viewer)
  if (searchParams.characterId)
    query.set("characterId", searchParams.characterId)

  const suffix = query.toString() ? `?${query.toString()}` : ""
  const response = await apiFetch(
    `/api/rpg/${rpgId}/characters/dashboard${suffix}`,
    {
      next: { revalidate: 0 },
      cache: "no-store",
    },
  )

  return parseJsonResponse<CharactersDashboardViewModel>(response)
}
