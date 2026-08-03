import type {
  CharacterStatusCurrentGateway,
  UpdateCharacterStatusCurrentResult,
} from "@/features/world/characters/application/status-current/contracts/CharacterStatusCurrentGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { createApiResponseParser } from "@/features/http/infrastructure/parseApiResponse"

const parseJsonResponse = createApiResponseParser({
  fallbackMessage: "Erro ao salvar status atual.",
})

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
