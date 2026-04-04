import { normalizeSkillTags } from "@/lib/rpg/skillTags"

type JsonLike = Record<string, unknown> | null

export type EntityCatalogAbilityRow = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  skillActionType: string | null
  skillTags: string[]
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: unknown
  cost: unknown
  requirement: unknown
}

export type EntityCatalogAbilityLevel = {
  levelNumber: number
  levelRequired: number
  levelCategory: string | null
  levelType: string | null
  levelActionType: string | null
  levelName: string | null
  levelDescription: string | null
  notesList: string[]
  customFields: Array<{ id: string; name: string; value: string | null }>
  description: string | null
  summary: string | null
  damage: string | null
  range: string | null
  cooldown: string | null
  duration: string | null
  castTime: string | null
  resourceCost: string | null
  pointsCost: number | null
  costCustom: string | null
}

export type EntityCatalogAbilityView = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  skillActionType: string | null
  skillTags: string[]
  levels: EntityCatalogAbilityLevel[]
}

function parseJsonObject(value: unknown): JsonLike {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function parseCostPoints(value: unknown) {
  const cost = parseJsonObject(value)
  return typeof cost?.points === "number" ? cost.points : null
}

function parseNotesList(stats: JsonLike) {
  const statsNotesListRaw = Array.isArray(stats?.notesList) ? stats.notesList : []
  const statsNotesList = statsNotesListRaw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
  const fallbackNote = toOptionalText(stats?.notes)
  return statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : []
}

function parseCustomFields(stats: JsonLike) {
  const statsCustomFieldsRaw = Array.isArray(stats?.customFields) ? stats.customFields : []
  return statsCustomFieldsRaw
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const name = typeof record.name === "string" ? record.name.trim() : ""
      if (!name) return null
      const id =
        typeof record.id === "string" && record.id.trim().length > 0
          ? record.id.trim()
          : `custom-${index}`
      return {
        id,
        name,
        value: toOptionalText(record.value),
      }
    })
    .filter((item): item is { id: string; name: string; value: string | null } => Boolean(item))
}

export function mapEntityCatalogAbilities(rows: EntityCatalogAbilityRow[]): EntityCatalogAbilityView[] {
  const bySkill = new Map<string, EntityCatalogAbilityView>()

  for (const row of rows) {
    const stats = parseJsonObject(row.stats)
    const cost = parseJsonObject(row.cost)

    if (!bySkill.has(row.skillId)) {
      bySkill.set(row.skillId, {
        skillId: row.skillId,
        skillName: row.skillName,
        skillDescription: toOptionalText(row.skillDescription),
        skillCategory: toOptionalText(row.skillCategory),
        skillType: toOptionalText(row.skillType),
        skillActionType: toOptionalText(row.skillActionType),
        skillTags: normalizeSkillTags(row.skillTags),
        levels: [],
      })
    }

    bySkill.get(row.skillId)?.levels.push({
      levelNumber: row.levelNumber,
      levelRequired: row.levelRequired,
      levelCategory: toOptionalText(stats?.category) ?? toOptionalText(row.skillCategory),
      levelType: toOptionalText(stats?.type) ?? toOptionalText(row.skillType),
      levelActionType: toOptionalText(stats?.actionType) ?? toOptionalText(row.skillActionType),
      levelName: toOptionalText(stats?.name),
      levelDescription: toOptionalText(stats?.description),
      notesList: parseNotesList(stats),
      customFields: parseCustomFields(stats),
      description: toOptionalText(stats?.description),
      summary: toOptionalText(row.summary),
      damage: toOptionalText(stats?.damage),
      range: toOptionalText(stats?.range),
      cooldown: toOptionalText(stats?.cooldown),
      duration: toOptionalText(stats?.duration),
      castTime: toOptionalText(stats?.castTime),
      resourceCost: toOptionalText(stats?.resourceCost),
      pointsCost: parseCostPoints(row.cost),
      costCustom: toOptionalText(cost?.custom),
    })
  }

  return Array.from(bySkill.values()).map((skill) => ({
    ...skill,
    levels: skill.levels.sort((a, b) => a.levelNumber - b.levelNumber),
  }))
}
