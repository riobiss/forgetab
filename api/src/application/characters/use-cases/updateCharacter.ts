import type { CharacterManagementService } from "@/application/characters/ports/CharacterManagementService"

export type UpdateCharacterPayload = {
  name?: string
  image?: string
  maxCarryWeight?: number | null
  statuses?: Record<string, number>
  attributes?: Record<string, number>
  skills?: Record<string, number>
  identity?: Record<string, string>
  characteristics?: Record<string, string>
  visibility?: "private" | "public"
  raceKey?: string
  classKey?: string
  progressionCurrent?: number
}

export async function updateCharacter(
  deps: { managementService: CharacterManagementService },
  params: {
    rpgId: string
    characterId: string
    userId: string
    payload: UpdateCharacterPayload
  },
) {
  await deps.managementService.updateCharacter(params)
}
