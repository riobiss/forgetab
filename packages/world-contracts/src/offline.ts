import type { CharacterInventoryItemDto } from "./character-inventory"

export type OfflineLabeledValueDto = {
  key: string
  label: string
  value: number
}

export type OfflineStatusItemDto = {
  key: string
  label: string
  max: number
  current: number
}

export type OfflineAbilityDto = {
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

export type OfflineCharacterSnapshotDto = {
  id: string
  name: string
  image: string | null
  characterType: "player" | "npc" | "monster"
  classLabel: string
  progressionLevelDisplay: string
  progressionCurrent: number
  statusEntries: OfflineStatusItemDto[]
  attributeEntries: OfflineLabeledValueDto[]
  skillEntries: OfflineLabeledValueDto[]
  inventory: CharacterInventoryItemDto[]
  abilities: OfflineAbilityDto[]
}

export type OfflineCampaignSnapshotDto = {
  id: string
  title: string
  description: string
  image: string | null
  characters: OfflineCharacterSnapshotDto[]
}

export type OfflineSnapshotDto = {
  version: 1
  syncedAt: string
  campaigns: OfflineCampaignSnapshotDto[]
}
