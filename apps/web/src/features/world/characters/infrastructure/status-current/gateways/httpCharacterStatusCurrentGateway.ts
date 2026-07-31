import type {
  CharacterStatusCurrentGateway,
  UpdateCharacterStatusCurrentResult,
} from "@/features/world/characters/application/status-current/contracts/CharacterStatusCurrentGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"

type ErrorPayload = {
  message?: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro ao salvar status atual.")
  }
  return payload
}

export const httpCharacterStatusCurrentGateway: CharacterStatusCurrentGateway = {
  async update({ rpgId, characterId, key, value }) {
    const response = await apiFetch(
      `/api/rpg/${rpgId}/characters/${characterId}/status-current`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      },
    )

    return parseJsonResponse<UpdateCharacterStatusCurrentResult>(response)
  },
}
