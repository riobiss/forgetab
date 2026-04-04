import {
  isProgressionMode,
  normalizeProgressionTiers,
  resolveProgressionTierByCurrent,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import type { CharacterProgressionPermissionService } from "@/application/characterProgression/ports/CharacterProgressionPermissionService"
import type { CharacterProgressionRepository } from "@/application/characterProgression/ports/CharacterProgressionRepository"
import { AppError } from "@/shared/errors/AppError"

type Dependencies = {
  repository: CharacterProgressionRepository
  permissionService: CharacterProgressionPermissionService
}

function validateAmount(
  amount: unknown,
  options: { allowNegative: boolean; zeroMessage: string },
) {
  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    throw new AppError(options.zeroMessage, 400)
  }

  if (options.allowNegative) {
    if (amount === 0) {
      throw new AppError(options.zeroMessage, 400)
    }
  } else if (amount <= 0) {
    throw new AppError(options.zeroMessage, 400)
  }

  return amount
}

async function loadPlayerCharacter(
  deps: Dependencies,
  params: { characterId: string; userId: string; deniedMessage: string; nonPlayerMessage: string },
) {
  const character = await deps.repository.findById(params.characterId)
  if (!character) {
    throw new AppError("Personagem nao encontrado.", 404)
  }

  const canManage = await deps.permissionService.canManageRpg(character.rpgId, params.userId)
  if (!canManage) {
    throw new AppError(params.deniedMessage, 403)
  }

  if (character.characterType !== "player") {
    throw new AppError(params.nonPlayerMessage, 400)
  }

  return character
}

function mapInfrastructureError(error: unknown, knownColumns: string[], message: string): never {
  if (
    error instanceof Error &&
    knownColumns.some((column) => error.message.includes(`column "${column}" does not exist`))
  ) {
    throw new AppError(message, 500)
  }

  throw error
}

export async function grantCharacterPointsUseCase(
  deps: Dependencies,
  params: { characterId: string; userId: string; amount: unknown },
) {
  try {
    const amount = validateAmount(params.amount, {
      allowNegative: true,
      zeroMessage: "amount deve ser um inteiro diferente de zero.",
    })

    await loadPlayerCharacter(deps, {
      characterId: params.characterId,
      userId: params.userId,
      deniedMessage: "Apenas mestre ou moderador podem conceder pontos.",
      nonPlayerMessage: "Somente personagens do tipo player podem receber pontos.",
    })

    const updated = await deps.repository.updateSkillPoints(params.characterId, amount)
    return {
      success: true,
      remainingPoints: updated.skillPoints,
    }
  } catch (error) {
    mapInfrastructureError(
      error,
      ["skill_points"],
      "Estrutura de personagens desatualizada. Rode a migration mais recente.",
    )
  }
}

export async function grantCharacterXpUseCase(
  deps: Dependencies,
  params: { characterId: string; userId: string; amount: unknown },
) {
  try {
    const amount = validateAmount(params.amount, {
      allowNegative: false,
      zeroMessage: "amount deve ser um inteiro maior que zero.",
    })

    const character = await loadPlayerCharacter(deps, {
      characterId: params.characterId,
      userId: params.userId,
      deniedMessage: "Apenas mestre ou moderador podem conceder XP.",
      nonPlayerMessage: "Somente personagens do tipo player podem receber XP.",
    })

    const nextProgressionCurrent = Math.max(0, (character.progressionCurrent ?? 0) + amount)
    const progressionMode = isProgressionMode(character.progressionMode)
      ? character.progressionMode
      : ("xp_level" as ProgressionMode)
    const progressionTiers = normalizeProgressionTiers(
      character.progressionTiers ?? [{ label: "Level 1", required: 0 }],
      progressionMode,
    )
    const resolvedTier = resolveProgressionTierByCurrent(
      progressionMode,
      progressionTiers,
      nextProgressionCurrent,
    )

    const updated = await deps.repository.updateProgression({
      characterId: params.characterId,
      progressionCurrent: nextProgressionCurrent,
      progressionLabel: resolvedTier.label,
      progressionRequired: resolvedTier.required,
    })

    return {
      success: true,
      progressionCurrent: updated.progressionCurrent,
      progressionLabel: updated.progressionLabel,
      progressionRequired: updated.progressionRequired,
    }
  } catch (error) {
    mapInfrastructureError(
      error,
      [
        "progression_mode",
        "progression_tiers",
        "progression_current",
        "progression_label",
        "progression_required",
      ],
      "Estrutura de progressao desatualizada. Rode a migration mais recente.",
    )
  }
}
