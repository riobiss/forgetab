import type { CharacterDetailViewModel } from "@/features/world/characters/application/detail/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { createApiResponseParser } from "@/features/http/infrastructure/parseApiResponse"

export class HttpCharacterDetailError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpCharacterDetailError"
  }
}

const parseJsonResponse = createApiResponseParser({
  fallbackMessage: "Erro ao carregar detalhe do personagem.",
  errorFactory: (message, status) =>
    new HttpCharacterDetailError(message, status),
})

export async function fetchCharacterDetailViewModel(
  rpgId: string,
  characterId: string,
): Promise<CharacterDetailViewModel> {
  const response = await apiFetch(
    `/api/rpg/${rpgId}/characters/${characterId}/detail`,
    {
      next: { revalidate: 0 },
      cache: "no-store",
    },
  )

  return parseJsonResponse<CharacterDetailViewModel>(response)
}
