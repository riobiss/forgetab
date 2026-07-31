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
