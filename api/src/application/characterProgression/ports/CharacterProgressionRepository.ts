import type { Prisma } from "../../../../generated/prisma/client.js"

export type CharacterProgressionSummary = {
  id: string
  rpgId: string
  characterType: "player" | "npc" | "monster"
  progressionMode?: string
  progressionTiers?: Prisma.JsonValue
  progressionCurrent?: number
}

export interface CharacterProgressionRepository {
  findById(characterId: string): Promise<CharacterProgressionSummary | null>
  updateSkillPoints(characterId: string, amount: number): Promise<{ skillPoints: number }>
  updateProgression(params: {
    characterId: string
    progressionCurrent: number
    progressionLabel: string
    progressionRequired: number
  }): Promise<{
    progressionCurrent: number
    progressionLabel: string
    progressionRequired: number
  }>
}
