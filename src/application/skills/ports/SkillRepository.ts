import type { SkillMetaCreateInput } from "@/lib/validators/skillBuilder"

export type AbilityCategoryConfig = {
  enabled: boolean
  categories: string[]
}

export type SkillDetails = {
  id: string
  ownerId: string
  rpgId: string | null
  rpgScope: string
  slug: string
  tags: string[]
  classIds: string[]
  raceIds: string[]
  levels: SkillLevelDetails[]
  createdAt: unknown
  updatedAt: unknown
}

export type SkillLevelDetails = {
  id: string
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: unknown
  cost: unknown
  target: unknown
  area: unknown
  scaling: unknown
  requirement: unknown
}

export type LinkValidationResult =
  | { ok: true }
  | {
      ok: false
      message: string
    }

export type CreateSkillRecordInput = {
  userId: string
  rpgId: string | null
  slug: string
  tags: string[]
  classIds: string[]
  raceIds: string[]
  level1: SkillMetaCreateInput["level1"]
}

export interface SkillRepository {
  listByOwner(userId: string, rpgId?: string | null): Promise<unknown[]>
  getAbilityCategoryConfig(rpgId: string | null): Promise<AbilityCategoryConfig>
  validateLinkIds(params: {
    rpgId: string | null
    classIds: string[]
    raceIds: string[]
  }): Promise<LinkValidationResult>
  createSkillRecord(params: CreateSkillRecordInput): Promise<string>
  findById(skillId: string, ownerId: string): Promise<SkillDetails | null>
  updateSkillMeta(params: {
    skillId: string
    ownerId: string
    slug: string
    tags: string[]
    classIds?: string[]
    raceIds?: string[]
  }): Promise<void>
  createLevel(params: {
    skillId: string
    levelNumber: number
    levelRequired: number
    summary: string | null
    stats: unknown
    cost: unknown
    target: unknown
    area: unknown
    scaling: unknown
    requirement: unknown
  }): Promise<void>
  updateLevel(params: {
    skillId: string
    levelId: string
    levelRequired: number
    summary: string | null
    stats: unknown
    cost: unknown
    target: unknown
    area: unknown
    scaling: unknown
    requirement: unknown
  }): Promise<void>
  deleteLevel(skillId: string, levelId: string): Promise<void>
  deleteSkill(skillId: string, ownerId: string): Promise<void>
}
