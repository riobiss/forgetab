import type { CharacterAbilitiesViewModel } from "@/application/characterAbilities/types"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

export class HttpCharacterAbilitiesError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpCharacterAbilitiesError"
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new HttpCharacterAbilitiesError(
      payload.message ?? "Erro ao carregar habilidades do personagem.",
      response.status,
    )
  }

  return payload
}

export async function fetchCharacterAbilitiesViewModel(
  rpgId: string,
  characterId: string,
): Promise<CharacterAbilitiesViewModel> {
  const response = await apiFetch(`/api/rpg/${rpgId}/characters/${characterId}/abilities`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })

  return parseJsonResponse<CharacterAbilitiesViewModel>(response)
}
