import type { CharacterSkillPurchaseService } from "@/application/characterAbilities/ports/CharacterSkillPurchaseService"
import { AppError } from "@/shared/errors/AppError"

type Dependencies = {
  service: CharacterSkillPurchaseService
}

function validatePayload(payload: { skillId?: unknown; level?: unknown }) {
  if (typeof payload.skillId !== "string" || !payload.skillId.trim()) {
    throw new AppError("skillId e obrigatorio.", 400)
  }

  if (typeof payload.level !== "number" || !Number.isInteger(payload.level) || payload.level <= 0) {
    throw new AppError("level deve ser um inteiro positivo.", 400)
  }

  return {
    skillId: payload.skillId.trim(),
    level: payload.level,
  }
}

export async function buyCharacterSkillUseCase(
  deps: Dependencies,
  params: {
    characterId: string
    userId: string
    payload: { skillId?: unknown; level?: unknown }
  },
) {
  const payload = validatePayload(params.payload)
  return deps.service.buySkill(params.characterId, params.userId, payload)
}

export async function removeCharacterSkillUseCase(
  deps: Dependencies,
  params: {
    characterId: string
    userId: string
    payload: { skillId?: unknown; level?: unknown }
  },
) {
  const payload = validatePayload(params.payload)
  return deps.service.removeSkill(params.characterId, params.userId, payload)
}
