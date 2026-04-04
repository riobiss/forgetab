import type {
  CreateOrUpdateSkillPayloadDto,
  UpdateSkillLevelPayloadDto,
} from "@/application/skillsDashboard/types"
import type { SkillCategory, SkillTag, SkillType } from "@/types/skillBuilder"

export type SkillMetaInput = {
  name: string
  description: string
  category: SkillCategory | ""
  type: SkillType | ""
  actionType: string | ""
  tags: SkillTag[]
  classIds: string[]
  raceIds: string[]
}

export type SkillLevelCustomFieldInput = {
  id: string
  name: string
  value: string
}

export type SkillLevelInput = {
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
  customFields: SkillLevelCustomFieldInput[]
}

function toOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return null
  const normalized = value.trim().replace(",", ".")
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function buildLevelPayload(
  meta: SkillMetaInput,
  level: SkillLevelInput,
  fallbackLevelRequired: number,
): UpdateSkillLevelPayloadDto {
  return {
    levelRequired: toOptionalNumber(level.levelRequired) ?? fallbackLevelRequired,
    summary: toOptionalText(level.summary),
    stats: {
      name: toOptionalText(meta.name),
      description: toOptionalText(meta.description),
      notes: null,
      notesList: [],
      customFields: level.customFields.map((field) => ({
        id: field.id,
        name: field.name,
        value: field.value,
      })),
      damage: toOptionalText(level.damage),
      cooldown: toOptionalText(level.cooldown),
      range: toOptionalText(level.range),
      duration: toOptionalText(level.duration),
      castTime: toOptionalText(level.castTime),
      resourceCost: toOptionalText(level.resourceCost),
      category: meta.category || null,
      type: meta.type || null,
      actionType: meta.actionType || null,
    },
    cost: {
      points: toOptionalNumber(level.costPoints),
      custom: toOptionalText(level.costCustom),
    },
    requirement: {
      levelRequired: toOptionalNumber(level.levelRequired),
      notes: toOptionalText(level.prerequisite),
    },
  }
}

export function mapCreateSkillPayload(params: {
  rpgId: string
  meta: SkillMetaInput
  level: SkillLevelInput
}): CreateOrUpdateSkillPayloadDto {
  return {
    rpgId: params.rpgId,
    tags: params.meta.tags,
    classIds: params.meta.classIds,
    raceIds: params.meta.raceIds,
    level1: buildLevelPayload(params.meta, params.level, 1),
  }
}

export function mapUpdateSkillMetaPayload(meta: SkillMetaInput): CreateOrUpdateSkillPayloadDto {
  return {
    tags: meta.tags,
    classIds: meta.classIds,
    raceIds: meta.raceIds,
  }
}

export function mapUpdateSkillLevelPayload(params: {
  meta: SkillMetaInput
  level: SkillLevelInput
  fallbackLevelRequired: number
}): UpdateSkillLevelPayloadDto {
  return buildLevelPayload(params.meta, params.level, params.fallbackLevelRequired)
}
