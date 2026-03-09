import type { CharacterAbilitiesGateway } from "@/application/characterAbilities/contracts/CharacterAbilitiesGateway"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpCharacterAbilitiesGateway: CharacterAbilitiesGateway = {
  async removeAbility(characterId: string, params: { skillId: string; level: number }) {
    const response = await fetch(`/api/characters/${characterId}/buy-skill`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    const payload = await parseJson<{ success?: boolean }>(response)
    return { success: Boolean(payload.success) }
  },
}
