import type { ProgressionMode, ProgressionTier } from "@/lib/rpg/progression"

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
