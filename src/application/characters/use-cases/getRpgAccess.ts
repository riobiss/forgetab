import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"
import type { RpgAccess } from "@/application/characters/types"

type GetRpgAccessInput = {
  rpgId: string
  userId: string
  repository: RpgAccessRepository
}

export async function getRpgAccess(input: GetRpgAccessInput): Promise<RpgAccess> {
  const rpg = await input.repository.getRpgAccessRow(input.rpgId)

  if (!rpg) {
    return {
      exists: false,
      canAccess: false,
      isOwner: false,
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: getDefaultProgressionTiers("xp_level"),
    }
  }

  const progressionMode = isProgressionMode(rpg.progressionMode)
    ? rpg.progressionMode
    : ("xp_level" as ProgressionMode)
  const progressionTiers = normalizeProgressionTiers(rpg.progressionTiers, progressionMode)

  if (rpg.ownerId === input.userId) {
    return {
      exists: true,
      canAccess: true,
      isOwner: true,
      useRaceBonuses: rpg.useRaceBonuses,
      useClassBonuses: rpg.useClassBonuses,
      useInventoryWeightLimit: rpg.useInventoryWeightLimit,
      allowMultiplePlayerCharacters: rpg.allowMultiplePlayerCharacters,
      progressionMode,
      progressionTiers,
    }
  }

  const membership = await input.repository.getMembership(input.rpgId, input.userId)
  const isAcceptedMember = membership?.status === "accepted"
  const isModerator = isAcceptedMember && membership?.role === "moderator"

  return {
    exists: true,
    canAccess: isAcceptedMember,
    isOwner: isModerator,
    useRaceBonuses: rpg.useRaceBonuses,
    useClassBonuses: rpg.useClassBonuses,
    useInventoryWeightLimit: rpg.useInventoryWeightLimit,
    allowMultiplePlayerCharacters: rpg.allowMultiplePlayerCharacters,
    progressionMode,
    progressionTiers,
  }
}
