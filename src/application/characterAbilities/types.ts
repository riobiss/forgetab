import type { Prisma } from "../../../../generated/prisma/client.js"

export type CharacterAbilitiesCharacterRow = {
  id: string
  rpgId: string
  name: string
  classKey: string | null
  visibility: "private" | "public"
  characterType: "player" | "npc" | "monster"
  createdByUserId: string | null
  abilities: Prisma.JsonValue
}

export type CharacterAbilitiesClassRow = {
  id: string
  key: string
  label: string
}

export type CharacterAbilitiesPurchasedSkillLevelRow = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  skillActionType: string | null
  skillTags: string[]
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Prisma.JsonValue
  cost: Prisma.JsonValue
  target: Prisma.JsonValue
  area: Prisma.JsonValue
  scaling: Prisma.JsonValue
  requirement: Prisma.JsonValue
}

export type CharacterAbilitiesSkillClassLinkRow = {
  skillId: string
  classLabel: string
}

export type CharacterAbilitiesSkillRaceLinkRow = {
  skillId: string
  raceLabel: string
}

export type PurchasedAbilityViewDto = {
  skillId: string
  levelNumber: number
  skillName: string
  levelName: string | null
  skillDescription: string | null
  levelDescription: string | null
  notesList: string[]
  customFields: Array<{ id: string; name: string; value: string | null }>
  skillCategory: string | null
  skillType: string | null
  skillActionType: string | null
  skillTags: string[]
  levelRequired: number
  summary: string | null
  damage: string | null
  range: string | null
  cooldown: string | null
  duration: string | null
  castTime: string | null
  resourceCost: string | null
  prerequisite: string | null
  allowedClasses: string[]
  allowedRaces: string[]
  pointsCost: number | null
  costCustom: string | null
}

export type CharacterAbilitiesViewModel = {
  rpgId: string
  characterId: string
  characterName: string
  classLabel: string
  abilities: PurchasedAbilityViewDto[]
}
