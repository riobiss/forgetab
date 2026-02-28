import { normalizeEnabledAbilityCategories } from "@/lib/rpg/abilityCategories"
import {
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import type { RpgPermissionService } from "@/modules/rpg/contracts/RpgPermissionService"
import type { RpgRepository } from "@/modules/rpg/contracts/RpgRepository"
import { AppError } from "@/modules/rpg/domain/errors"

type GetRpgByIdDependencies = {
  repository: RpgRepository
  permissionService: RpgPermissionService
}

export async function getRpgById(
  deps: GetRpgByIdDependencies,
  params: { rpgId: string; userId: string },
) {
  const rpg = await deps.repository.findById(params.rpgId)

  if (!rpg) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  const permission = await deps.permissionService.getPermission(params.rpgId, params.userId)
  if (!permission.isOwner && rpg.visibility === "private" && !permission.isAcceptedMember) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  const progressionMode = isProgressionMode(rpg.progressionMode)
    ? rpg.progressionMode
    : ("xp_level" as ProgressionMode)

  return {
    rpg: {
      id: rpg.id,
      title: rpg.title,
      description: rpg.description,
      image: rpg.image,
      visibility: rpg.visibility,
      costsEnabled: rpg.costsEnabled,
      costResourceName: rpg.costResourceName,
      useMundiMap: rpg.useMundiMap,
      useRaceBonuses: rpg.useRaceBonuses,
      useClassBonuses: rpg.useClassBonuses,
      useClassRaceBonuses: rpg.useClassRaceBonuses,
      useInventoryWeightLimit: rpg.useInventoryWeightLimit,
      allowMultiplePlayerCharacters: rpg.allowMultiplePlayerCharacters,
      usersCanManageOwnXp: rpg.usersCanManageOwnXp,
      allowSkillPointDistribution: rpg.allowSkillPointDistribution,
      abilityCategoriesEnabled: rpg.abilityCategoriesEnabled,
      enabledAbilityCategories: normalizeEnabledAbilityCategories(rpg.enabledAbilityCategories),
      progressionMode,
      progressionTiers: normalizeProgressionTiers(rpg.progressionTiers, progressionMode),
      canManage: permission.canManage,
      canDelete: permission.isOwner,
    },
  }
}
