import type { JsonValue } from "@/features/shared/application/json"

export type CharacterAbility = {
  skillId: string
  level: number
}

export type CharacterAbilityMutationContext = {
  character: {
    id: string
    rpgId: string
    ownerId: string
    createdByUserId: string | null
    classKey: string | null
    characterType: "player" | "npc" | "monster"
    skillPoints: number
    abilities: JsonValue
    costsEnabled: boolean
  } | null
  skillLevelExists: boolean
  skillLevelCost: JsonValue
  skillBelongsToCharacterClass: boolean
}

export type CharacterAbilityMutation = {
  abilities: CharacterAbility[]
  skillPointsDelta?: number
}

export interface CharacterAbilityMutationRepository {
  mutate(
    params: {
      characterId: string
      rpgId?: string
      skillId: string
      level: number
    },
    decide: (
      context: CharacterAbilityMutationContext
    ) => CharacterAbilityMutation
  ): Promise<{ remainingPoints: number }>
}
