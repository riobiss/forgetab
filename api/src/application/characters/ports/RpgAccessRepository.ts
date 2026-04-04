import type { Prisma } from "../../../../generated/prisma/client.js"

export type RpgAccessRow = {
  ownerId: string
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  progressionMode: string
  progressionTiers: Prisma.JsonValue
}

export type RpgMembershipRow = {
  status: string
  role: string
}

export interface RpgAccessRepository {
  getRpgAccessRow(rpgId: string): Promise<RpgAccessRow | null>
  getMembership(rpgId: string, userId: string): Promise<RpgMembershipRow | null>
}
