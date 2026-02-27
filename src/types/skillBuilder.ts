import { abilityCategoryKeys } from "@/lib/rpg/abilityCategories"

export const effectTypeValues = [
  "damage",
  "heal",
  "buff",
  "debuff",
  "applyStatus",
  "removeStatus",
  "shield",
  "createZone",
  "summon",
  "move",
] as const

export const targetStatValues = [
  "hp",
  "armor",
  "shield",
  "mana",
  "sanity",
  "attribute",
] as const

export const valueModeValues = ["flat", "dice"] as const
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

export type EffectType = (typeof effectTypeValues)[number]
export type TargetStat = (typeof targetStatValues)[number]
export type ValueMode = (typeof valueModeValues)[number]
export type SkillCategory = (typeof skillCategoryValues)[number]
export type SkillType = (typeof skillTypeValues)[number]
export type SkillTag = (typeof skillTagValues)[number]
export type ActionType = (typeof actionTypeValues)[number]

export type EffectValue = {
  mode: ValueMode
  flat?: number | null
  diceCount?: number | null
  diceSides?: number | null
  bonus?: number | null
}

export type Effect = {
  id: string
  type: EffectType
  targetStat?: TargetStat | null
  attributeKey?: string | null
  value?: EffectValue | null
  damageType?: string | null
  duration?: string | null
  tickInterval?: string | null
  chance?: number | null
  stacks?: number | null
  notes?: string | null
}

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
  effects: Effect[]
  createdAt: string
  updatedAt: string
}

export type Skill = {
  id: string
  ownerId: string
  rpgId?: string | null
  rpgScope: string
  name: string
  slug: string
  category?: SkillCategory | null
  type?: SkillType | null
  actionType?: ActionType | null
  tags: SkillTag[]
  description?: string | null
  currentLevel: number
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
