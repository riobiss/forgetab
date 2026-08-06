import type { CharacterAbilitiesDependencies } from "@/features/world/characters/application/abilities/contracts/CharacterAbilitiesDependencies"

export async function removeCharacterAbilityUseCase(
  deps: CharacterAbilitiesDependencies,
  params: { characterId: string; skillId: string; level: number }
) {
  return deps.gateway.removeAbility(params.characterId, {
    skillId: params.skillId,
    level: params.level
  })
}
