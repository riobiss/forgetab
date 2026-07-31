import type { CharacterRow } from "@/features/world/character/application/types"

export type CharacterUpdateCommand = {
  rpgId: string
  characterId: string
  name: string
  image: string | null
  visibility: "private" | "public" | null
  raceKey: string | null
  classKey: string | null
  maxCarryWeight: number | null
  progressionMode: string
  progressionLabel: string
  progressionRequired: number
  progressionCurrent: number
  statuses: Record<string, number> | null
  currentStatuses: Record<string, number> | null
  attributes: Record<string, number> | null
  skills: Record<string, number> | null
  identity: Record<string, string>
  characteristics: Record<string, string>
  hasImage: boolean
  hasRaceKey: boolean
  hasClassKey: boolean
  hasMaxCarryWeight: boolean
}

export interface CharacterUpdateRepository {
  findById(rpgId: string, characterId: string): Promise<CharacterRow | null>
  update(command: CharacterUpdateCommand): Promise<boolean>
}
