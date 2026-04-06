import type { CharactersDashboardViewModel } from "@/application/charactersDashboard/types"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

export class HttpCharactersDashboardError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpCharactersDashboardError"
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new HttpCharactersDashboardError(
      payload.message ?? "Erro ao carregar dashboard de personagens.",
      response.status,
    )
  }

  return payload
}

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
  if (searchParams.characterId) query.set("characterId", searchParams.characterId)

  const suffix = query.toString() ? `?${query.toString()}` : ""
  const response = await apiFetch(`/api/rpg/${rpgId}/characters/dashboard${suffix}`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })

  return parseJsonResponse<CharactersDashboardViewModel>(response)
}
