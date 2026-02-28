import type { ActionType, SkillCategory, SkillTag, SkillType } from "@/types/skillBuilder"

export type OwnedRpg = { id: string; title: string }
export type TemplateOption = { id: string; label: string }

export type RpgSettingsPayload = {
  rpg?: {
    abilityCategoriesEnabled?: boolean
    enabledAbilityCategories?: string[]
  }
  message?: string
}

export type SkillListItem = {
  id: string
  slug: string
  updatedAt: string
}

export type SkillLevel = {
  id: string
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Record<string, unknown> | null
  cost: Record<string, unknown> | null
  requirement: Record<string, unknown> | null
}

export type SkillDetail = {
  id: string
  slug: string
  tags: SkillTag[]
  classIds: string[]
  raceIds: string[]
  levels: SkillLevel[]
}

export type MetaForm = {
  name: string
  category: SkillCategory | ""
  type: SkillType | ""
  actionType: ActionType | ""
  tags: SkillTag[]
  description: string
  classIds: string[]
  raceIds: string[]
}

export type LevelForm = {
  levelName: string
  levelDescription: string
  notesList: string[]
  levelRequired: string
  summary: string
  damage: string
  cooldown: string
  range: string
  duration: string
  castTime: string
  resourceCost: string
  costPoints: string
  costCustom: string
  prerequisite: string
  levelCategory: SkillCategory | ""
  levelType: SkillType | ""
  levelActionType: ActionType | ""
  customFields: { id: string; name: string; value: string }[]
}

export type SkillsDashboardProps = {
  ownedRpgs: OwnedRpg[]
  initialRpgId?: string
  hideRpgSelector?: boolean
  title?: string
}
