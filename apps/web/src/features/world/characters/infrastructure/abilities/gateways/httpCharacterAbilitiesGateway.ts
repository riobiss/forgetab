import type { CharacterAbilitiesGateway } from "@/features/world/characters/application/abilities/contracts/CharacterAbilitiesGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse as parseJson } from "@/features/http/infrastructure/parseApiResponse"

export const httpCharacterAbilitiesGateway: CharacterAbilitiesGateway = {
  async removeAbility(
    characterId: string,
    params: { skillId: string; level: number }
  ) {
    const response = await apiFetch(
      `/api/characters/${characterId}/buy-skill`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      }
    )
    const payload = await parseJson<{ success?: boolean }>(response)
    return { success: Boolean(payload.success) }
  }
}
