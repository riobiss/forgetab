import {
  actionTypeValues,
  skillCategoryValues,
  skillTagValues,
  skillTypeValues,
  type ActionType,
  type SkillCategory,
  type SkillType,
} from "@/types/skillBuilder"
import { abilityCategoryLabelByKey } from "@/lib/rpg/abilityCategories"
import type { LevelForm, MetaForm, SkillDetail, SkillLevel } from "./types"

export function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeObsList(values: string[]) {
  return values.map((item) => item.trim()).filter((item) => item.length > 0)
}

export function mapSkillToMetaForm(skill: SkillDetail): MetaForm {
  const normalizedTags = Array.isArray(skill.tags)
    ? skill.tags.filter((item) => skillTagValues.includes(item))
    : []

  return {
    name: "",
    category: "",
    type: "",
    actionType: "",
    tags: Array.from(new Set(normalizedTags)),
    description: "",
    classIds: skill.classIds,
    raceIds: skill.raceIds,
  }
}

export function mapLevelToForm(level: SkillLevel): LevelForm {
  const stats = level.stats ?? {}
  const cost = level.cost ?? {}
  const requirement = level.requirement ?? {}
  const statsNotesListRaw = Array.isArray(stats.notesList) ? stats.notesList : []
  const statsNotesList = statsNotesListRaw
    .map((item) => (typeof item === "string" ? item : ""))
    .filter((item) => item.trim().length > 0)
  const fallbackNote = typeof stats.notes === "string" ? stats.notes : ""
  const customFieldsRaw = Array.isArray(stats.customFields) ? stats.customFields : []
  const customFields = customFieldsRaw
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const name = typeof record.name === "string" ? record.name.trim() : ""
      if (!name) return null
      const value = typeof record.value === "string" ? record.value : ""
      const id = typeof record.id === "string" && record.id.trim() ? record.id : `custom-${index}`
      return { id, name, value }
    })
    .filter((item): item is { id: string; name: string; value: string } => Boolean(item))

  return {
    levelName: typeof stats.name === "string" ? stats.name : "",
    levelDescription: typeof stats.description === "string" ? stats.description : "",
    notesList: statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : [""],
    levelRequired: String(level.levelRequired),
    summary: level.summary ?? "",
    damage: typeof stats.damage === "string" ? stats.damage : "",
    cooldown: typeof stats.cooldown === "string" ? stats.cooldown : "",
    range: typeof stats.range === "string" ? stats.range : "",
    duration: typeof stats.duration === "string" ? stats.duration : "",
    castTime: typeof stats.castTime === "string" ? stats.castTime : "",
    resourceCost: typeof stats.resourceCost === "string" ? stats.resourceCost : "",
    costPoints: typeof cost.points === "number" ? String(cost.points) : "",
    costCustom: typeof cost.custom === "string" ? cost.custom : "",
    prerequisite: typeof requirement.notes === "string" ? requirement.notes : "",
    levelCategory: skillCategoryValues.includes(stats.category as SkillCategory)
      ? (stats.category as SkillCategory)
      : "",
    levelType: skillTypeValues.includes(stats.type as SkillType) ? (stats.type as SkillType) : "",
    levelActionType: actionTypeValues.includes(stats.actionType as ActionType)
      ? (stats.actionType as ActionType)
      : "",
    customFields,
  }
}

export function getLevelCostPoints(level: SkillLevel) {
  if (!level.cost || typeof level.cost !== "object" || Array.isArray(level.cost)) {
    return null
  }

  const value = (level.cost as Record<string, unknown>).points
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null
  }

  return Math.floor(value)
}

export function createInitialMeta(): MetaForm {
  return {
    name: "",
    category: "",
    type: "",
    actionType: "",
    tags: [],
    description: "",
    classIds: [],
    raceIds: [],
  }
}

export function createInitialLevel(): LevelForm {
  return {
    levelName: "",
    levelDescription: "",
    notesList: [""],
    levelRequired: "1",
    summary: "",
    damage: "",
    cooldown: "",
    range: "",
    duration: "",
    castTime: "",
    resourceCost: "",
    costPoints: "",
    costCustom: "",
    prerequisite: "",
    levelCategory: "",
    levelType: "",
    levelActionType: "",
    customFields: [],
  }
}

export function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

export function resolveCategoryLabel(value: string) {
  return abilityCategoryLabelByKey[value as SkillCategory] ?? value
}
