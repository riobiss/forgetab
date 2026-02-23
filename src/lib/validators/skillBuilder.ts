import { z } from "zod"
import {
  effectTypeValues,
  skillCategoryValues,
  skillUsageTypeValues,
  targetStatValues,
  valueModeValues,
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

const optionalSkillUsageType = z
  .union([z.enum(skillUsageTypeValues), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null))

const optionalSkillCategory = z
  .union([z.enum(skillCategoryValues), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null))

const idListSchema = z
  .array(z.string().trim().min(1))
  .max(100)
  .transform((list) => Array.from(new Set(list.map((item) => item.trim()))))

const effectValueSchema = z.object({
  mode: z.enum(valueModeValues),
  flat: optionalPositiveNumber,
  diceCount: optionalPositiveInt,
  diceSides: optionalPositiveInt,
  bonus: optionalPositiveInt,
})

const effectSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: z.enum(effectTypeValues),
  targetStat: z.enum(targetStatValues).nullable().optional(),
  attributeKey: optionalTrimmedText,
  value: effectValueSchema.nullable().optional(),
  damageType: optionalTrimmedText,
  duration: optionalTrimmedText,
  tickInterval: optionalTrimmedText,
  chance: optionalPositiveNumber,
  stacks: optionalPositiveInt,
  notes: optionalTrimmedText,
})

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
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  category: optionalSkillCategory.optional(),
  type: optionalSkillUsageType.optional(),
  description: optionalTrimmedText.optional(),
  currentLevel: z.number().int().min(1).optional(),
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
      effects: z.array(effectSchema).max(50).optional().default([]),
    })
    .optional()
    .default({
      levelRequired: 1,
      summary: null,
      effects: [],
    }),
})

export const skillMetaPatchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  category: optionalSkillCategory.optional(),
  type: optionalSkillUsageType.optional(),
  description: optionalTrimmedText.optional(),
  currentLevel: z.number().int().min(1).optional(),
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
  effects: z.array(effectSchema).max(50).optional(),
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
  effects: z.array(effectSchema).max(50).optional(),
})

export function buildSkillSlug(name: string) {
  const normalized = slugify(name)
  return normalized || `skill-${crypto.randomUUID().slice(0, 8)}`
}

export function createRpgScope(rpgId?: string | null) {
  return rpgId?.trim() || "global"
}

export type SkillMetaCreateInput = z.infer<typeof skillMetaCreateSchema>
export type SkillMetaPatchInput = z.infer<typeof skillMetaPatchSchema>
export type SkillLevelCreateInput = z.infer<typeof skillLevelCreateSchema>
export type SkillLevelPatchInput = z.infer<typeof skillLevelPatchSchema>
