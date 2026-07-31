import { AppError } from "@/features/shared/application/errors/AppError"
import type { CharacterAbilityMutationRepository } from "@/features/world/character/application/abilities/ports/CharacterAbilityMutationRepository"
import {
  addAbility,
  ownsAbility,
  parseCharacterAbilities,
  parseCostPoints,
  removeAbility,
} from "@/features/world/character/application/abilities/rules/characterAbilityRules"
import { rethrowCharacterRepositoryError } from "@/features/world/character/application/errors/rethrowCharacterRepositoryError"

type Dependencies = {
  repository: CharacterAbilityMutationRepository
}

function validatePayload(payload: { skillId?: unknown; level?: unknown }) {
  if (typeof payload.skillId !== "string" || !payload.skillId.trim()) {
    throw new AppError("skillId e obrigatorio.", 400)
  }

  if (
    typeof payload.level !== "number" ||
    !Number.isInteger(payload.level) ||
    payload.level <= 0
  ) {
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
  try {
    const result = await deps.repository.mutate(
      {
        characterId: params.characterId,
        skillId: payload.skillId,
        level: payload.level,
      },
      (context) => {
        const character = context.character
        if (!character) throw new AppError("Personagem nao encontrado.", 404)
        if (character.characterType !== "player") {
          throw new AppError(
            "Somente personagens do tipo player podem comprar habilidades.",
            400,
          )
        }
        if (
          character.createdByUserId !== params.userId &&
          character.ownerId !== params.userId
        ) {
          throw new AppError(
            "Sem permissao para comprar habilidades neste personagem.",
            403,
          )
        }
        if (!character.costsEnabled) {
          throw new AppError("Sistema de custos desativado neste RPG.", 400)
        }
        if (!character.classKey) {
          throw new AppError("Personagem sem classe definida.", 400)
        }
        if (!context.skillBelongsToCharacterClass) {
          throw new AppError(
            "Nao e permitido comprar habilidade de outra classe.",
            400,
          )
        }
        if (!context.skillLevelExists) {
          throw new AppError("Level da habilidade nao encontrado.", 404)
        }

        const abilities = parseCharacterAbilities(character.abilities)
        if (ownsAbility(abilities, payload.skillId, payload.level)) {
          throw new AppError(
            "Personagem ja possui este level da habilidade.",
            409,
          )
        }
        if (
          payload.level > 1 &&
          !ownsAbility(abilities, payload.skillId, payload.level - 1)
        ) {
          throw new AppError(
            `Para comprar o level ${payload.level}, primeiro compre o level ${payload.level - 1}.`,
            400,
          )
        }

        const costPoints = parseCostPoints(context.skillLevelCost) ?? 0
        if (character.skillPoints < costPoints) {
          throw new AppError(
            "Pontos insuficientes para comprar esta habilidade.",
            400,
          )
        }

        return {
          abilities: addAbility(abilities, payload.skillId, payload.level),
          skillPointsDelta: -costPoints,
        }
      },
    )

    return { status: 200, success: true as const, ...result }
  } catch (error) {
    rethrowCharacterRepositoryError(error)
  }
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
  try {
    const result = await deps.repository.mutate(
      {
        characterId: params.characterId,
        skillId: payload.skillId,
        level: payload.level,
      },
      (context) => {
        const character = context.character
        if (!character) throw new AppError("Personagem nao encontrado.", 404)
        if (character.characterType !== "player") {
          throw new AppError(
            "Somente personagens do tipo player podem remover habilidades.",
            400,
          )
        }
        if (
          character.createdByUserId !== params.userId &&
          character.ownerId !== params.userId
        ) {
          throw new AppError(
            "Sem permissao para remover habilidades neste personagem.",
            403,
          )
        }

        const abilities = parseCharacterAbilities(character.abilities)
        if (!ownsAbility(abilities, payload.skillId, payload.level)) {
          throw new AppError("Habilidade nao encontrada no personagem.", 404)
        }
        if (!context.skillLevelExists) {
          throw new AppError("Level da habilidade nao encontrado.", 404)
        }

        const refundPoints = character.costsEnabled
          ? (parseCostPoints(context.skillLevelCost) ?? 0)
          : 0
        return {
          abilities: removeAbility(
            abilities,
            payload.skillId,
            payload.level,
          ),
          skillPointsDelta: refundPoints,
        }
      },
    )

    return { status: 200, success: true as const, ...result }
  } catch (error) {
    rethrowCharacterRepositoryError(error)
  }
}
