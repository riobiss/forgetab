import { Prisma } from "../../../../../generated/prisma/client.js"
import { createRpgSchema } from "@/lib/validators/rpg"
import { normalizeEnabledAbilityCategories } from "@/lib/rpg/abilityCategories"
import {
  enforceXpLevelPattern,
  getDefaultProgressionTiers,
  isProgressionMode,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import type { ImageGateway } from "@/modules/rpg/contracts/ImageGateway"
import type { RpgPermissionService } from "@/modules/rpg/contracts/RpgPermissionService"
import type { RpgRepository } from "@/modules/rpg/contracts/RpgRepository"
import { AppError } from "@/modules/rpg/domain/errors"

type UpdateRpgDependencies = {
  repository: RpgRepository
  permissionService: RpgPermissionService
  imageGateway: ImageGateway
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isSchemaOutdatedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('relation "rpgs" does not exist') ||
    error.message.includes('column "costs_enabled" does not exist') ||
    error.message.includes('column "cost_resource_name" does not exist') ||
    error.message.includes('column "image" does not exist') ||
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

export async function updateRpg(
  deps: UpdateRpgDependencies,
  params: { rpgId: string; userId: string; body: unknown },
) {
  try {
    const safeBody =
      params.body && typeof params.body === "object" && !Array.isArray(params.body)
        ? (params.body as Record<string, unknown>)
        : {}

    const requestedCostsUpdate =
      Object.prototype.hasOwnProperty.call(safeBody, "costsEnabled") ||
      Object.prototype.hasOwnProperty.call(safeBody, "costResourceName")

    if (requestedCostsUpdate) {
      throw new AppError("Configuracao de custos disponivel apenas na criacao do RPG.", 400)
    }

    const hasImageInBody = Object.prototype.hasOwnProperty.call(safeBody, "image")
    const parsed = createRpgSchema.safeParse(params.body)

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
    }

    const permission = await deps.permissionService.getPermission(params.rpgId, params.userId)
    if (!permission.exists) {
      throw new AppError("RPG nao encontrado.", 404)
    }
    if (!permission.canManage) {
      throw new AppError("Voce nao pode editar este RPG.", 403)
    }

    const {
      title,
      description,
      image,
      visibility,
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

    const currentProgressionMode = await deps.repository.getCurrentProgressionMode(params.rpgId)
    if (progressionMode !== undefined && resolvedProgressionMode !== currentProgressionMode) {
      throw new AppError("Modo de progressao nao pode ser alterado apos a criacao do RPG.", 400)
    }

    let previousImage: string | null = null
    if (hasImageInBody) {
      try {
        previousImage = await deps.repository.getImageById(params.rpgId)
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

    const updated = await deps.repository.updateCore(params.rpgId, { title, description, visibility })
    if (!updated) {
      throw new AppError("RPG nao encontrado.", 404)
    }

    if (
      typeof useMundiMap === "boolean" ||
      typeof useRaceBonuses === "boolean" ||
      typeof useClassBonuses === "boolean" ||
      typeof useClassRaceBonuses === "boolean" ||
      typeof useInventoryWeightLimit === "boolean" ||
      typeof allowMultiplePlayerCharacters === "boolean" ||
      typeof usersCanManageOwnXp === "boolean" ||
      typeof allowSkillPointDistribution === "boolean" ||
      typeof abilityCategoriesEnabled === "boolean" ||
      enabledAbilityCategories !== undefined ||
      progressionMode !== undefined ||
      progressionTiers !== undefined
    ) {
      await deps.repository.updateAdvanced(params.rpgId, {
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
    }

    const normalizedImage = normalizeOptionalText(image)
    if (hasImageInBody) {
      try {
        const imageUpdated = await deps.repository.updateImage(params.rpgId, normalizedImage)
        if (!imageUpdated) {
          throw new AppError("RPG nao encontrado.", 404)
        }
      } catch (error) {
        if (error instanceof AppError) {
          throw error
        }
        if (error instanceof Error && error.message.includes('column "image" does not exist')) {
          throw new AppError(
            "Estrutura de RPG desatualizada. Rode a migration mais recente.",
            500,
          )
        }
        throw error
      }

      if (previousImage && previousImage !== normalizedImage) {
        try {
          await deps.imageGateway.deleteRpgImageByUrl({
            ownerId: permission.ownerId ?? params.userId,
            imageUrl: previousImage,
          })
        } catch {
          // Nao bloqueia a atualizacao do RPG caso a limpeza da imagem falhe.
        }
      }
    }

    return { message: "RPG atualizado com sucesso." }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      throw new AppError("Tabela de RPG nao existe no banco. Rode a migration.", 500)
    }

    if (isSchemaOutdatedError(error)) {
      throw new AppError("Tabela de RPG nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao atualizar RPG.", 500)
  }
}
