import type { ProgressionMode, ProgressionTier } from "@/lib/rpg/progression"
import type { AbilityCategoryKey } from "@/lib/rpg/abilityCategories"

export type CreateRpgPayloadDto = {
  title: string
  description: string
  image?: string
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  useRaceBonuses: boolean
  useClassBonuses: boolean
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
}

export type CreatedRpgDto = {
  id: string
}

export type RpgEditorTemplateFieldDto = {
  key: string
  label: string
}

export type RpgEditorIdentityFieldDto = {
  key: string
  label: string
  required: boolean
  position: number
}

export type RpgEditorCatalogOptionDto = {
  key: string
  label: string
  position?: number
  category?: string
  attributeBonuses?: Record<string, number>
  skillBonuses?: Record<string, number>
  lore?: unknown
}

export type RpgEditorDetailDto = {
  id: string
  title: string
  description: string
  image?: string | null
  visibility: "private" | "public"
  costsEnabled?: boolean
  costResourceName?: string
  useMundiMap?: boolean
  useRaceBonuses?: boolean
  useClassBonuses?: boolean
  useClassRaceBonuses?: boolean
  useInventoryWeightLimit?: boolean
  allowMultiplePlayerCharacters?: boolean
  usersCanManageOwnXp?: boolean
  allowSkillPointDistribution?: boolean
  abilityCategoriesEnabled?: boolean
  enabledAbilityCategories?: string[]
  progressionMode?: ProgressionMode
  progressionTiers?: ProgressionTier[]
  canManage?: boolean
  canDelete?: boolean
}

export type RpgEditorBootstrapDto = {
  rpg: RpgEditorDetailDto | null
  attributes: RpgEditorTemplateFieldDto[]
  statuses: RpgEditorTemplateFieldDto[]
  skills: RpgEditorTemplateFieldDto[]
  races: RpgEditorCatalogOptionDto[]
  classes: RpgEditorCatalogOptionDto[]
  identityFields: RpgEditorIdentityFieldDto[]
  characteristicFields: RpgEditorIdentityFieldDto[]
}

export type UpdateRpgPayloadDto = {
  title: string
  description: string
  image: string | null
  visibility: "private" | "public"
  useMundiMap: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  usersCanManageOwnXp: boolean
  allowSkillPointDistribution: boolean
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: AbilityCategoryKey[]
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
}
