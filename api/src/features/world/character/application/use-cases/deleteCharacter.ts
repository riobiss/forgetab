import type { CharacterManagementService } from "@/features/world/character/application/ports/CharacterManagementService"

export async function deleteCharacter(
  deps: { managementService: CharacterManagementService },
  params: { rpgId: string; characterId: string; userId: string },
) {
  await deps.managementService.deleteCharacter(params)
}
