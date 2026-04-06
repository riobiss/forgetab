import type { CharacterDetailViewModel } from "@/application/charactersDetail/types"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

export class HttpCharacterDetailError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpCharacterDetailError"
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new HttpCharacterDetailError(
      payload.message ?? "Erro ao carregar detalhe do personagem.",
      response.status,
    )
  }

  return payload
}

export async function fetchCharacterDetailViewModel(
  rpgId: string,
  characterId: string,
): Promise<CharacterDetailViewModel> {
  const response = await apiFetch(`/api/rpg/${rpgId}/characters/${characterId}/detail`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })

  return parseJsonResponse<CharacterDetailViewModel>(response)
}
