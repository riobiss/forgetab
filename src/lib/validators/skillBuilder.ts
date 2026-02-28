import { z } from "zod"
import {
  actionTypeValues,
  skillCategoryValues,
  skillTagValues,
  skillTypeValues,
} from "@/types/skillBuilder"
import slugify from "@/utils/slugify"

const optionalTrimmedText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  })

const optionalPositiveNumber = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null,
  )

const optionalPositiveInt = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : null,
  )

const optionalSkillType = z
  .union([z.enum(skillTypeValues), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null))

const optionalActionType = z
  .union([z.enum(actionTypeValues), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null))

const optionalSkillCategory = z
  .union([z.enum(skillCategoryValues), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null))

const idListSchema = z
  .array(z.string().trim().min(1))
  .max(100)
  .transform((list) => Array.from(new Set(list.map((item) => item.trim()))))

const tagListSchema = z
  .array(z.enum(skillTagValues))
  .max(30)
  .transform((list) => Array.from(new Set(list)))

const costSchema = z
  .object({
    mana: optionalPositiveNumber,
    exhaustion: optionalPositiveNumber,
    hp: optionalPositiveNumber,
    sanity: optionalPositiveNumber,
    actionPoints: optionalPositiveNumber,
    points: z.number().int().min(0).nullable().optional(),
    custom: optionalTrimmedText,
  })
  .partial()

const targetSchema = z
  .object({
    mode: z.enum(["self", "ally", "enemy", "area", "any"]).nullable().optional(),
    count: optionalPositiveInt,
    description: optionalTrimmedText,
  })
  .partial()

const areaSchema = z
  .object({
    shape: z.enum(["single", "circle", "cone", "line", "zone"]).nullable().optional(),
    size: optionalPositiveNumber,
    unit: z.enum(["m", "tiles"]).nullable().optional(),
    description: optionalTrimmedText,
  })
  .partial()

const scalingSchema = z
  .object({
    attributeKey: optionalTrimmedText,
    ratio: optionalPositiveNumber,
    perLevelBonus: optionalPositiveNumber,
    notes: optionalTrimmedText,
  })
  .partial()

const requirementSchema = z
  .object({
    levelRequired: optionalPositiveInt,
    classIds: idListSchema.optional(),
    raceIds: idListSchema.optional(),
    statuses: z.array(z.string().trim().min(1)).max(30).optional(),
    attributes: z.record(z.string(), z.number()).optional(),
    notes: optionalTrimmedText,
  })
  .partial()

const skillStatsSchema = z
  .object({
    name: optionalTrimmedText,
    category: optionalSkillCategory,
    type: optionalSkillType,
    actionType: optionalActionType,
    description: optionalTrimmedText,
    notes: optionalTrimmedText,
    notesList: z.array(optionalTrimmedText).max(20).optional(),
    damage: optionalTrimmedText,
    cooldown: optionalTrimmedText,
    range: optionalTrimmedText,
    duration: optionalTrimmedText,
    castTime: optionalTrimmedText,
    resourceCost: optionalTrimmedText,
  })
  .partial()

export const skillMetaCreateSchema = z.object({
  rpgId: z.string().trim().min(1).nullable().optional(),
  slug: z.string().trim().min(2, "Slug deve ter pelo menos 2 caracteres.").optional(),
  tags: tagListSchema.optional().default([]),
  classIds: idListSchema.optional().default([]),
  raceIds: idListSchema.optional().default([]),
  level1: z
    .object({
      levelRequired: z.number().int().min(1).optional().default(1),
      summary: optionalTrimmedText.optional(),
      stats: skillStatsSchema.nullable().optional(),
      cost: costSchema.nullable().optional(),
      target: targetSchema.nullable().optional(),
      area: areaSchema.nullable().optional(),
      scaling: scalingSchema.nullable().optional(),
      requirement: requirementSchema.nullable().optional(),
    })
    .optional()
    .default({
      levelRequired: 1,
      summary: null,
    }),
})

export const skillMetaPatchSchema = z.object({
  slug: z.string().trim().min(2).optional(),
  tags: tagListSchema.optional(),
  classIds: idListSchema.optional(),
  raceIds: idListSchema.optional(),
})

export const skillLevelCreateSchema = z.object({
  levelRequired: z.number().int().min(1).optional(),
  summary: optionalTrimmedText.optional(),
  stats: skillStatsSchema.nullable().optional(),
  cost: costSchema.nullable().optional(),
  target: targetSchema.nullable().optional(),
  area: areaSchema.nullable().optional(),
  scaling: scalingSchema.nullable().optional(),
  requirement: requirementSchema.nullable().optional(),
})

export const skillLevelPatchSchema = z.object({
  levelRequired: z.number().int().min(1).optional(),
  summary: optionalTrimmedText.optional(),
  stats: skillStatsSchema.nullable().optional(),
  cost: costSchema.nullable().optional(),
  target: targetSchema.nullable().optional(),
  area: areaSchema.nullable().optional(),
  scaling: scalingSchema.nullable().optional(),
  requirement: requirementSchema.nullable().optional(),
})

export function buildSkillSlug(raw: string) {
  const normalized = slugify(raw)
  return normalized || `skill-${crypto.randomUUID().slice(0, 8)}`
}

export function createRpgScope(rpgId?: string | null) {
  return rpgId?.trim() || "global"
}

export type SkillMetaCreateInput = z.infer<typeof skillMetaCreateSchema>
export type SkillMetaPatchInput = z.infer<typeof skillMetaPatchSchema>
export type SkillLevelCreateInput = z.infer<typeof skillLevelCreateSchema>
export type SkillLevelPatchInput = z.infer<typeof skillLevelPatchSchema>
