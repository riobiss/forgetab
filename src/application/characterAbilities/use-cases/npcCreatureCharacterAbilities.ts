import type { NpcCreatureCharacterAbilityService } from "@/application/characterAbilities/ports/NpcCreatureCharacterAbilityService"
import { AppError } from "@/shared/errors/AppError"

type Dependencies = {
  service: NpcCreatureCharacterAbilityService
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

export async function addNpcCreatureCharacterAbilityUseCase(
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

export async function removeNpcCreatureCharacterAbilityUseCase(
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
