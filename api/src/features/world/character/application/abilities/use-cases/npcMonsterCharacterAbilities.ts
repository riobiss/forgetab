import { AppError } from "@/features/shared/application/errors/AppError"
import type { CharacterAbilitiesParserService } from "@/features/world/character/application/abilities/ports/CharacterAbilitiesParserService"
import type { CharacterAbilitiesRepository } from "@/features/world/character/application/abilities/ports/CharacterAbilitiesRepository"
import type { CharacterAbilityMutationRepository } from "@/features/world/character/application/abilities/ports/CharacterAbilityMutationRepository"
import type { RpgAccessRepository } from "@/features/world/character/application/ports/RpgAccessRepository"
import {
  addAbility,
  ownsAbility,
  parseCharacterAbilities,
  removeAbility,
} from "@/features/world/character/application/abilities/rules/characterAbilityRules"
import { loadCharacterAbilitiesUseCase } from "@/features/world/character/application/abilities/use-cases/characterAbilities"
import { rethrowCharacterRepositoryError } from "@/features/world/character/application/errors/rethrowCharacterRepositoryError"
import { getRpgAccess } from "@/features/world/character/application/use-cases/getRpgAccess"

type Dependencies = {
  mutationRepository: CharacterAbilityMutationRepository
  abilitiesRepository: CharacterAbilitiesRepository
  rpgAccessRepository: RpgAccessRepository
  parserService: CharacterAbilitiesParserService
}

function validatePayload(payload: { skillId?: unknown; level?: unknown }) {
  if (typeof payload.skillId !== "string" || !payload.skillId.trim()) {
    throw new AppError("skillId e obrigatorio.", 400)
  }

  const level =
    typeof payload.level === "number" &&
    Number.isInteger(payload.level) &&
    payload.level > 0
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
  const payload = validatePayload(params.payload)
  await assertCanManage(deps.rpgAccessRepository, params.rpgId, params.userId)

  try {
    await deps.mutationRepository.mutate(
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        skillId: payload.skillId,
        level: payload.level,
      },
      (context) => {
        const character = context.character
        if (!character) throw new AppError("Personagem nao encontrado.", 404)
        if (character.characterType === "player") {
          throw new AppError(
            "Use a ficha do player para gerenciar habilidades de player.",
            400,
          )
        }
        if (!context.skillLevelExists) {
          throw new AppError("Habilidade nao encontrada neste RPG.", 404)
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
            `Para adicionar o level ${payload.level}, primeiro adicione o level ${payload.level - 1}.`,
            400,
          )
        }

        return {
          abilities: addAbility(abilities, payload.skillId, payload.level),
        }
      },
    )

    const view = await loadCharacterAbilitiesUseCase(
      {
        repository: deps.abilitiesRepository,
        rpgAccessRepository: deps.rpgAccessRepository,
        parserService: deps.parserService,
      },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: params.userId,
      },
    )
    const ability = view?.abilities.find(
      (item) =>
        item.skillId === payload.skillId &&
        item.levelNumber === payload.level,
    )
    if (!ability) {
      throw new AppError("Habilidade nao encontrada no personagem.", 404)
    }

    return { success: true as const, ability }
  } catch (error) {
    rethrowCharacterRepositoryError(error)
  }
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
  const payload = validatePayload(params.payload)
  await assertCanManage(deps.rpgAccessRepository, params.rpgId, params.userId)

  try {
    await deps.mutationRepository.mutate(
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        skillId: payload.skillId,
        level: payload.level,
      },
      (context) => {
        const character = context.character
        if (!character) throw new AppError("Personagem nao encontrado.", 404)
        if (character.characterType === "player") {
          throw new AppError(
            "Use a ficha do player para gerenciar habilidades de player.",
            400,
          )
        }

        const abilities = parseCharacterAbilities(character.abilities)
        if (!ownsAbility(abilities, payload.skillId, payload.level)) {
          throw new AppError("Habilidade nao encontrada no personagem.", 404)
        }

        return {
          abilities: removeAbility(
            abilities,
            payload.skillId,
            payload.level,
          ),
        }
      },
    )

    return { success: true as const }
  } catch (error) {
    rethrowCharacterRepositoryError(error)
  }
}

async function assertCanManage(
  repository: RpgAccessRepository,
  rpgId: string,
  userId: string,
) {
  const access = await getRpgAccess({ repository, rpgId, userId })
  if (!access.exists) throw new AppError("RPG nao encontrado.", 404)
  if (!access.isOwner) {
    throw new AppError(
      "Sem permissao para gerenciar habilidades deste personagem.",
      403,
    )
  }
}
