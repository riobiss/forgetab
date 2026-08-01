import type {
  CatalogEntityType,
  EntityCatalogMeta,
} from "@/features/world/catalog/domain/types"

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

export type EntityCatalogItem = {
  id: string
  slug: string
  name: string
  category: string
  meta: EntityCatalogMeta
  href: string
  entityType: CatalogEntityType
}

export type EntityCatalogSort =
  | "name-asc"
  | "name-desc"
  | "slug-asc"
  | "slug-desc"
  | "category-asc"

export type EntityCatalogFilters = {
  search: string
  category: string
  sort: EntityCatalogSort
}

export type EntityCatalogGroup = {
  key: string
  label: string
  count: number
  items: EntityCatalogItem[]
}

export type EntityCatalogPageData = {
  canManage: boolean
  items: EntityCatalogItem[]
}

export type EntityCatalogPlayerItem = {
  id: string
  name: string
  image: string | null
  classKey: string | null
  raceKey: string | null
}

export type EntityCatalogTemplateRecord = Record<string, unknown> & {
  id?: string
  key?: string
  label?: string
  category?: string
  catalogMeta?: EntityCatalogMeta | Record<string, unknown> | null
}

export type EntityCatalogAbilityPurchaseResult = {
  success: boolean
  message: string
  remainingPoints: number | null
}

export type EntityCatalogTemplateOption = {
  key: string
  label: string
}

export type EntityCatalogCurrentDetail = {
  id: string
  key: string
  label: string
  category: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
  catalogMeta: EntityCatalogMeta
  lore?: unknown
}

export type EntityCatalogAbilityPurchaseState = {
  characterId: string | null
  costsEnabled: boolean
  costResourceName: string
  initialPoints: number
  initialOwnedBySkill: Record<string, number[]>
}

export type EntityCatalogDetailData = {
  canManage: boolean
  current: EntityCatalogCurrentDetail
  attributeTemplates: EntityCatalogTemplateOption[]
  skillTemplates: EntityCatalogTemplateOption[]
  abilities: EntityCatalogAbilityView[]
  players: EntityCatalogPlayerItem[]
  abilityPurchase: EntityCatalogAbilityPurchaseState
}
