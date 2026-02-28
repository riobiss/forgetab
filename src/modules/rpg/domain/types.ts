import type { ProgressionMode, ProgressionTier } from "@/lib/rpg/progression"
import type { Prisma } from "../../../../generated/prisma/client.js"

export type RpgRow = {
  id: string
  ownerId: string
  title: string
  description: string
  image: string | null
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  useMundiMap: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useClassRaceBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  usersCanManageOwnXp: boolean
  allowSkillPointDistribution: boolean
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: string[]
  progressionMode: string
  progressionTiers: Prisma.JsonValue
}

export type RpgAdvancedSettingsInput = {
  useMundiMap: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  usersCanManageOwnXp: boolean
  allowSkillPointDistribution: boolean
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: string[]
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
}

export type RpgCoreUpdateInput = {
  title: string
  description: string
  visibility: "private" | "public"
}

export type RpgCreateBaseInput = {
  ownerId: string
  title: string
  description: string
  visibility: "private" | "public"
}

export type RpgCreateBaseResult = {
  id: string
  ownerId: string
  title: string
  description: string
  visibility: "private" | "public"
  createdAt: Date
}

export type RpgCreateSettingsInput = RpgAdvancedSettingsInput & {
  costsEnabled: boolean
  costResourceName: string
}
