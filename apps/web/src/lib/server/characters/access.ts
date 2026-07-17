import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import {
  prismaRpgAccessRepository,
  type RpgAccessRepository,
} from "./repositories/rpgAccessRepository"
import type { RpgAccess } from "./types"

type GetRpgAccessInput = {
  rpgId: string
  userId: string
  repository?: RpgAccessRepository
}

export async function getRpgAccess({
  rpgId,
  userId,
  repository = prismaRpgAccessRepository,
}: GetRpgAccessInput): Promise<RpgAccess> {
  const rpg = await repository.getRpgAccessRow(rpgId)

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
  const progressionTiers = normalizeProgressionTiers(
    rpg.progressionTiers,
    progressionMode,
  )

  if (rpg.ownerId === userId) {
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

  const membership = await repository.getMembership(rpgId, userId)
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
