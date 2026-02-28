import { Prisma } from "../../../../../generated/prisma/client.js"
import { normalizeEnabledAbilityCategories } from "@/lib/rpg/abilityCategories"
import {
  enforceXpLevelPattern,
  getDefaultProgressionTiers,
  isProgressionMode,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import { createRpgSchema } from "@/lib/validators/rpg"
import type { RpgRepository } from "@/modules/rpg/contracts/RpgRepository"
import { AppError } from "@/modules/rpg/domain/errors"

type CreateRpgDependencies = {
  repository: RpgRepository
}

function isSchemaOutdatedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('relation "rpgs" does not exist') ||
    error.message.includes('column "costs_enabled" does not exist') ||
    error.message.includes('column "cost_resource_name" does not exist') ||
    error.message.includes('column "allow_multiple_player_characters" does not exist') ||
    error.message.includes('column "users_can_manage_own_xp" does not exist') ||
    error.message.includes('column "allow_skill_point_distribution" does not exist') ||
    error.message.includes('column "ability_categories_enabled" does not exist') ||
    error.message.includes('column "enabled_ability_categories" does not exist') ||
    error.message.includes('column "progression_mode" does not exist') ||
    error.message.includes('column "progression_tiers" does not exist') ||
    error.message.includes("Could not find the table")
  )
}

export async function createRpg(
  deps: CreateRpgDependencies,
  params: { userId: string; body: unknown },
) {
  try {
    const parsed = createRpgSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
    }

    const {
      title,
      description,
      image,
      visibility,
      costsEnabled,
      costResourceName,
      useMundiMap,
      useRaceBonuses,
      useClassBonuses,
      useClassRaceBonuses,
      useInventoryWeightLimit,
      allowMultiplePlayerCharacters,
      usersCanManageOwnXp,
      allowSkillPointDistribution,
      abilityCategoriesEnabled,
      enabledAbilityCategories,
      progressionMode,
      progressionTiers,
    } = parsed.data

    const resolvedImage = image?.trim() || null
    const resolvedCostsEnabled = Boolean(costsEnabled)
    const resolvedCostResourceName = (costResourceName?.trim() || "Skill Points").slice(0, 60)
    const resolvedUseRaceBonuses =
      typeof useRaceBonuses === "boolean" ? useRaceBonuses : Boolean(useClassRaceBonuses)
    const resolvedUseClassBonuses =
      typeof useClassBonuses === "boolean" ? useClassBonuses : Boolean(useClassRaceBonuses)
    const resolvedAllowMultiplePlayerCharacters = Boolean(allowMultiplePlayerCharacters ?? false)
    const resolvedUsersCanManageOwnXp = Boolean(usersCanManageOwnXp ?? true)
    const resolvedAllowSkillPointDistribution = Boolean(allowSkillPointDistribution ?? true)
    const resolvedAbilityCategoriesEnabled = Boolean(abilityCategoriesEnabled ?? false)
    const resolvedEnabledAbilityCategories = normalizeEnabledAbilityCategories(
      enabledAbilityCategories ?? [],
    )

    if (resolvedAbilityCategoriesEnabled && resolvedEnabledAbilityCategories.length === 0) {
      throw new AppError("Ative pelo menos uma categoria", 400)
    }

    const resolvedProgressionMode = isProgressionMode(progressionMode)
      ? progressionMode
      : ("xp_level" as ProgressionMode)
    const resolvedProgressionTiers =
      progressionTiers && progressionTiers.length > 0
        ? resolvedProgressionMode === "xp_level"
          ? enforceXpLevelPattern(
              progressionTiers.map((item) => ({
                label: item.label.trim(),
                required: Math.max(0, Math.floor(item.required)),
              })),
            )
          : progressionTiers.map((item) => ({
              label: item.label.trim(),
              required: Math.max(0, Math.floor(item.required)),
            }))
        : getDefaultProgressionTiers(resolvedProgressionMode)

    const created = await deps.repository.createBase({
      ownerId: params.userId,
      title,
      description,
      visibility,
    })

    await deps.repository.applyCreateSettings(created.id, {
      costsEnabled: resolvedCostsEnabled,
      costResourceName: resolvedCostResourceName,
      useMundiMap: Boolean(useMundiMap),
      useRaceBonuses: resolvedUseRaceBonuses,
      useClassBonuses: resolvedUseClassBonuses,
      useInventoryWeightLimit: Boolean(useInventoryWeightLimit),
      allowMultiplePlayerCharacters: resolvedAllowMultiplePlayerCharacters,
      usersCanManageOwnXp: resolvedUsersCanManageOwnXp,
      allowSkillPointDistribution: resolvedAllowSkillPointDistribution,
      abilityCategoriesEnabled: resolvedAbilityCategoriesEnabled,
      enabledAbilityCategories: resolvedEnabledAbilityCategories,
      progressionMode: resolvedProgressionMode,
      progressionTiers: resolvedProgressionTiers,
    })

    if (resolvedImage) {
      try {
        await deps.repository.updateImage(created.id, resolvedImage)
      } catch (error) {
        if (error instanceof Error && error.message.includes('column "image" does not exist')) {
          throw new AppError(
            "Estrutura de RPG desatualizada. Rode a migration mais recente.",
            500,
          )
        }

        throw error
      }
    }

    return {
      rpg: {
        id: created.id,
        ownerId: created.ownerId,
        title: created.title,
        description: created.description,
        image: resolvedImage,
        visibility: created.visibility,
        costsEnabled: resolvedCostsEnabled,
        costResourceName: resolvedCostResourceName,
        useMundiMap: Boolean(useMundiMap),
        useRaceBonuses: resolvedUseRaceBonuses,
        useClassBonuses: resolvedUseClassBonuses,
        useClassRaceBonuses: resolvedUseRaceBonuses || resolvedUseClassBonuses,
        useInventoryWeightLimit: Boolean(useInventoryWeightLimit),
        allowMultiplePlayerCharacters: resolvedAllowMultiplePlayerCharacters,
        usersCanManageOwnXp: resolvedUsersCanManageOwnXp,
        allowSkillPointDistribution: resolvedAllowSkillPointDistribution,
        abilityCategoriesEnabled: resolvedAbilityCategoriesEnabled,
        enabledAbilityCategories: resolvedEnabledAbilityCategories,
        progressionMode: resolvedProgressionMode,
        progressionTiers: resolvedProgressionTiers,
        createdAt: created.createdAt,
      },
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        throw new AppError("Tabela de RPG nao existe no banco. Rode a migration.", 500)
      }

      if (error.code === "P2003") {
        throw new AppError("Usuario do token nao existe no banco atual.", 409)
      }
    }

    if (isSchemaOutdatedError(error)) {
      throw new AppError("Tabela de RPG nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao criar RPG.", 500)
  }
}
