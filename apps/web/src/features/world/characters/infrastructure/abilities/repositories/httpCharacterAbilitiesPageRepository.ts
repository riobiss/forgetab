import type { CharacterAbilitiesViewModel } from "@/features/world/characters/application/abilities/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { createApiResponseParser } from "@/features/http/infrastructure/parseApiResponse"

export class HttpCharacterAbilitiesError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpCharacterAbilitiesError"
  }
}

const parseJsonResponse = createApiResponseParser({
  fallbackMessage: "Erro ao carregar habilidades do personagem.",
  errorFactory: (message, status) =>
    new HttpCharacterAbilitiesError(message, status),
})

export async function fetchCharacterAbilitiesViewModel(
  rpgId: string,
  characterId: string,
): Promise<CharacterAbilitiesViewModel> {
  const response = await apiFetch(
    `/api/rpg/${rpgId}/characters/${characterId}/abilities`,
    {
      next: { revalidate: 0 },
      cache: "no-store",
    },
  )

  return parseJsonResponse<CharacterAbilitiesViewModel>(response)
}
