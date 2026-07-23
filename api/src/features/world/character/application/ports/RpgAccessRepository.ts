import type { JsonValue } from "@/application/shared/json"

export type RpgAccessRow = {
  ownerId: string
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  progressionMode: string
  progressionTiers: JsonValue
}

export type RpgMembershipRow = {
  status: string
  role: string
}

export interface RpgAccessRepository {
  getRpgAccessRow(rpgId: string): Promise<RpgAccessRow | null>
  getMembership(rpgId: string, userId: string): Promise<RpgMembershipRow | null>
}
