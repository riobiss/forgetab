import { abilityCategoryKeys } from "@/lib/rpg/abilityCategories"

export const actionTypeValues = ["action", "bonus", "reaction", "passive"] as const
export const skillCategoryValues = abilityCategoryKeys
export const skillTypeValues = [
  "attack",
  "burst",
  "support",
  "buff",
  "debuff",
  "control",
  "defense",
  "mobility",
  "summon",
  "utility",
  "resource",
] as const
export const skillTagValues = [
  "ice",
  "water",
  "wind",
  "earth",
  "light",
  "dark",
  "shadow",
  "infernal",
  "holy",
  "poison",
  "blood",
  "psychic",
  "time",
  "sound",
  "arcane",
  "void",
  "life",
  "death",
  "energy",
] as const

export type SkillCategory = (typeof skillCategoryValues)[number]
export type SkillType = (typeof skillTypeValues)[number]
export type SkillTag = (typeof skillTagValues)[number]
export type ActionType = (typeof actionTypeValues)[number]

export type Cost = {
  mana?: number | null
  exhaustion?: number | null
  hp?: number | null
  sanity?: number | null
  actionPoints?: number | null
  points?: number | null
  custom?: string | null
}

export type Target = {
  mode?: "self" | "ally" | "enemy" | "area" | "any" | null
  count?: number | null
  description?: string | null
}

export type Area = {
  shape?: "single" | "circle" | "cone" | "line" | "zone" | null
  size?: number | null
  unit?: "m" | "tiles" | null
  description?: string | null
}

export type Scaling = {
  attributeKey?: string | null
  ratio?: number | null
  perLevelBonus?: number | null
  notes?: string | null
}

export type Requirement = {
  levelRequired?: number | null
  classIds?: string[]
  raceIds?: string[]
  statuses?: string[]
  attributes?: Record<string, number>
  notes?: string | null
}

export type SkillStats = {
  name?: string | null
  category?: SkillCategory | null
  type?: SkillType | null
  actionType?: ActionType | null
  description?: string | null
  notes?: string | null
  notesList?: Array<string | null> | null
  damage?: string | null
  cooldown?: string | null
  range?: string | null
  duration?: string | null
  castTime?: string | null
  resourceCost?: string | null
}

export type SkillLevel = {
  id: string
  levelNumber: number
  levelRequired: number
  summary?: string | null
  stats?: SkillStats | null
  cost?: Cost | null
  target?: Target | null
  area?: Area | null
  scaling?: Scaling | null
  requirement?: Requirement | null
  createdAt: string
  updatedAt: string
}

export type Skill = {
  id: string
  ownerId: string
  rpgId?: string | null
  rpgScope: string
  slug: string
  tags: SkillTag[]
  classIds: string[]
  raceIds: string[]
  levels: SkillLevel[]
  createdAt: string
  updatedAt: string
}

export function resolveSkillLevelForPlayer(levels: SkillLevel[], playerLevel: number) {
  if (levels.length === 0) {
    return null
  }

  const sorted = [...levels].sort((left, right) => left.levelRequired - right.levelRequired)
  let best = sorted[0]

  for (const level of sorted) {
    if (level.levelRequired <= playerLevel) {
      best = level
    }
  }

  return best
}
