import type { ProgressionMode, ProgressionTier } from "@/lib/rpg/progression"

export type CharacterEditorTemplateFieldDto = {
  key: string
  label: string
  position: number
}

export type CharacterIdentityFieldDto = {
  key: string
  label: string
  required: boolean
  position: number
}

export type CharacterOptionDto = {
  key: string
  label: string
}

export type CharacterEditorCharacterTypeDto = "player" | "npc" | "monster"
export type CharacterEditorVisibilityDto = "private" | "public"

export type CharacterEditorSummaryDto = {
  id: string
  name: string
  image?: string | null
  raceKey?: string | null
  classKey?: string | null
  characterType: CharacterEditorCharacterTypeDto
  visibility: CharacterEditorVisibilityDto
  maxCarryWeight?: number | null
  progressionMode?: string
  progressionLabel?: string
  progressionRequired?: number
  progressionCurrent?: number
  createdByUserId?: string | null
  statuses?: Record<string, number>
  attributes?: Record<string, number>
  skills?: Record<string, number>
  identity?: Record<string, string>
  characteristics?: Record<string, string>
}

export type CharacterEditorRpgSettingsDto = {
  useRaceBonuses?: boolean
  useClassBonuses?: boolean
  useClassRaceBonuses?: boolean
  useInventoryWeightLimit?: boolean
  progressionMode?: ProgressionMode
  progressionTiers?: ProgressionTier[]
  canManage?: boolean
  canDelete?: boolean
}

export type CharacterEditorBootstrapDto = {
  attributes: CharacterEditorTemplateFieldDto[]
  statuses: CharacterEditorTemplateFieldDto[]
  skills: CharacterEditorTemplateFieldDto[]
  characters: CharacterEditorSummaryDto[]
  rpg: CharacterEditorRpgSettingsDto | null
  races: CharacterOptionDto[]
  classes: CharacterOptionDto[]
  identityFields: CharacterIdentityFieldDto[]
  characteristicFields: CharacterIdentityFieldDto[]
}

export type UpsertCharacterPayloadDto = {
  name: string
  image: string | null
  raceKey?: string
  classKey?: string
  characterType?: CharacterEditorCharacterTypeDto
  maxCarryWeight?: number | null
  visibility?: CharacterEditorVisibilityDto
  progressionCurrent: number
  statuses: Record<string, number>
  attributes: Record<string, number>
  identity: Record<string, string>
  characteristics: Record<string, string>
  skills?: Record<string, number>
}
