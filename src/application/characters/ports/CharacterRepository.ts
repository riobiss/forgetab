import type { CharacterRow } from "@/application/characters/types"

type ListCharactersInput = {
  rpgId: string
  userId: string
  isOwner: boolean
}

type CreateCharacterRowInput = {
  rpgId: string
  name: string
  image: string | null
  raceKey: string | null
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  maxCarryWeight: number | null
  progressionMode: string
  progressionLabel: string
  progressionRequired: number
  progressionCurrent: number
  createdByUserId: string | null
  life: number
  defense: number
  mana: number
  exhaustion: number
  sanity: number
  statuses: Record<string, number>
  attributes: Record<string, number>
  skills: Record<string, number>
  identity: Record<string, string>
  characteristics: Record<string, string>
}

export interface CharacterRepository {
  listByRpg(input: ListCharactersInput): Promise<CharacterRow[]>
  countPlayersByCreator(rpgId: string, userId: string): Promise<number>
  create(input: CreateCharacterRowInput): Promise<CharacterRow>
}
