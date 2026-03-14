import type { NpcMonsterCharacterAbilityService } from "@/application/characterAbilities/ports/NpcMonsterCharacterAbilityService"
import { AppError } from "@/shared/errors/AppError"

type Dependencies = {
  service: NpcMonsterCharacterAbilityService
}

function validatePayload(payload: { skillId?: unknown; level?: unknown }) {
  if (typeof payload.skillId !== "string" || !payload.skillId.trim()) {
    throw new AppError("skillId e obrigatorio.", 400)
  }

  const level =
    typeof payload.level === "number" && Number.isInteger(payload.level) && payload.level > 0
      ? payload.level
      : 1

  return {
    skillId: payload.skillId.trim(),
    level,
  }
}

export async function addNpcMonsterCharacterAbilityUseCase(
  deps: Dependencies,
  params: {
    rpgId: string
    characterId: string
    userId: string
    payload: { skillId?: unknown; level?: unknown }
  },
) {
  return deps.service.addAbility(
    params.rpgId,
    params.characterId,
    params.userId,
    validatePayload(params.payload),
  )
}

export async function removeNpcMonsterCharacterAbilityUseCase(
  deps: Dependencies,
  params: {
    rpgId: string
    characterId: string
    userId: string
    payload: { skillId?: unknown; level?: unknown }
  },
) {
  return deps.service.removeAbility(
    params.rpgId,
    params.characterId,
    params.userId,
    validatePayload(params.payload),
  )
}
