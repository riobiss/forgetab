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
