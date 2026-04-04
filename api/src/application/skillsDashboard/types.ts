import type { SkillTag } from "@/types/skillBuilder"

export type TemplateOptionDto = { id: string; label: string }

export type RpgSettingsDto = {
  costResourceName?: string
  abilityCategoriesEnabled?: boolean
  enabledAbilityCategories?: string[]
}

export type SkillListItemDto = {
  id: string
  slug: string
  updatedAt: string
}

export type SkillSearchIndexItemDto = {
  searchBlob: string
  displayName: string
  filters: {
    categories: string[]
    types: string[]
    actionTypes: string[]
    tags: string[]
  }
}

export type SkillLevelDto = {
  id: string
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Record<string, unknown> | null
  cost: Record<string, unknown> | null
  requirement: Record<string, unknown> | null
}

export type SkillDetailDto = {
  id: string
  slug: string
  tags: SkillTag[]
  classIds: string[]
  raceIds: string[]
  levels: SkillLevelDto[]
}

export type CreateOrUpdateSkillPayloadDto = {
  rpgId?: string
  tags?: SkillTag[]
  classIds?: string[]
  raceIds?: string[]
  level1?: unknown
}

export type UpdateSkillLevelPayloadDto = {
  levelRequired: number
  summary: string | null
  stats: Record<string, unknown>
  cost: Record<string, unknown>
  requirement: Record<string, unknown>
}
