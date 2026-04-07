import type { JsonValue } from "@/application/shared/json"
import type { ProgressionMode, ProgressionTier } from "@/lib/rpg/progression"

export type CharacterDetailRowDto = {
  id: string
  name: string
  image: string | null
  raceKey: string | null
  classKey: string | null
  skillPoints: number
  costResourceName: string
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
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
  statuses: JsonValue
  currentStatuses: JsonValue
  attributes: JsonValue
  skills: JsonValue
  identity: JsonValue
  characteristics: JsonValue
  createdAt: Date
}

export type CharacterDetailRpgDto = {
  id: string
  ownerId: string
  visibility: "private" | "public"
  usersCanManageOwnXp: boolean
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
}

export type CharacterDetailLabelDto = {
  key: string
  label: string
}

export type CharacterDetailClassLabelDto = {
  id: string
  key: string
  label: string
}

export type CharacterDetailTemplateFieldDto = {
  key: string
  label: string
  position?: number
}

export type CharacterDetailStatusItemDto = {
  key: string
  label: string
  max: number
  current: number
}

export type CharacterDetailIdentityItemDto = {
  key: string
  label: string
  value: string
  href?: string
}

export type CharacterDetailLabeledValueDto = {
  key: string
  label: string
  value: number
}

export type CharacterDetailViewModel = {
  rpgId: string
  characterId: string
  displayName: string
  image: string | null
  characterType: "player" | "npc" | "monster"
  canEditCharacter: boolean
  skillPoints: number
  costResourceName: string
  statusEntries: CharacterDetailStatusItemDto[]
  attributeEntries: CharacterDetailLabeledValueDto[]
  skillEntries: CharacterDetailLabeledValueDto[]
  usersCanManageOwnXp: boolean
  progressionLevelDisplay: string
  progressionCurrent: number
  nextProgressionTierText: string
  aboutText: string
  identityItems: CharacterDetailIdentityItemDto[]
  characteristicsItems: CharacterDetailIdentityItemDto[]
  maskStatuses: boolean
  maskAttributes: boolean
  maskSkills: boolean
}

export type LoadCharacterDetailResult =
  | { status: "ok"; data: CharacterDetailViewModel }
  | { status: "not_found" }
  | { status: "private_blocked" }
