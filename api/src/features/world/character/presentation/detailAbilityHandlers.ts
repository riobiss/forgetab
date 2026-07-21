import type { FastifyReply, FastifyRequest } from "fastify"
import { loadCharacterAbilitiesUseCase } from "@/application/characters/abilities/use-cases/characterAbilities"
import {
  addNpcMonsterCharacterAbilityUseCase,
  removeNpcMonsterCharacterAbilityUseCase,
} from "@/application/characters/abilities/use-cases/npcMonsterCharacterAbilities"
import {
  buyCharacterSkillUseCase,
  removeCharacterSkillUseCase,
} from "@/application/characters/abilities/use-cases/characterSkillPurchase"
import { deleteCharacter } from "@/application/characters/use-cases/deleteCharacter"
import { getEditableCharacter } from "@/application/characters/use-cases/getEditableCharacter"
import {
  updateCharacter,
  type UpdateCharacterPayload,
} from "@/application/characters/use-cases/updateCharacter"
import { loadCharacterDetailUseCase } from "@/application/characters/detail/use-cases/loadCharacterDetail"
import { characterRouteDeps } from "./dependencies"
import { parseJsonBody, requireUserId, writeError, writeJson } from "./http"
import type { CharacterInventoryRouteParams, CharacterRouteParams } from "./routeTypes"

export async function buyCharacterSkillHandler(
  request: FastifyRequest<{ Params: CharacterRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await buyCharacterSkillUseCase(
      { service: characterRouteDeps.characterSkillPurchaseService },
      {
        characterId: request.params.id,
        userId: auth.userId,
        payload: parseJsonBody(request.body),
      },
    )

    return writeJson(reply, payload.status, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao comprar habilidade.")
  }
}

export async function removeCharacterSkillHandler(
  request: FastifyRequest<{ Params: CharacterRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await removeCharacterSkillUseCase(
      { service: characterRouteDeps.characterSkillPurchaseService },
      {
        characterId: request.params.id,
        userId: auth.userId,
        payload: parseJsonBody(request.body),
      },
    )

    return writeJson(reply, payload.status, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover habilidade.")
  }
}

export async function getCharacterByIdHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const character = await getEditableCharacter(
      { editorService: characterRouteDeps.characterEditorService },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
      },
    )

    return writeJson(reply, 200, { character })
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar personagem.")
  }
}

export async function getCharacterDetailHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const result = await loadCharacterDetailUseCase(
      {
        repository: characterRouteDeps.characterDetailRepository,
        rpgAccessRepository: characterRouteDeps.rpgAccessRepository,
        permissionService: characterRouteDeps.characterDetailPermissionService,
      },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
      },
    )

    if (result.status === "not_found" || result.status === "private_blocked") {
      return writeJson(reply, 404, { message: "Personagem nao encontrado." })
    }

    return writeJson(reply, 200, result.data)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar detalhe do personagem.")
  }
}

export async function updateCharacterHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = parseJsonBody(request.body) as UpdateCharacterPayload
    await updateCharacter(
      { managementService: characterRouteDeps.characterManagementService },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
        payload,
      },
    )

    const updatedCharacter = await getEditableCharacter(
      { editorService: characterRouteDeps.characterEditorService },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
      },
    )

    return writeJson(
      reply,
      200,
      updatedCharacter
        ? { message: "Personagem atualizado com sucesso.", character: updatedCharacter }
        : { message: "Personagem atualizado com sucesso." },
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar personagem.")
  }
}

export async function deleteCharacterHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    await deleteCharacter(
      { managementService: characterRouteDeps.characterManagementService },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
      },
    )

    return writeJson(reply, 200, { message: "Personagem deletado com sucesso." })
  } catch (error) {
    return writeError(reply, error, "Erro interno ao deletar personagem.")
  }
}

export async function getNpcMonsterCharacterAbilitiesHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await loadCharacterAbilitiesUseCase(
      {
        repository: characterRouteDeps.abilitiesRepository,
        rpgAccessRepository: characterRouteDeps.rpgAccessRepository,
        parserService: characterRouteDeps.abilitiesParserService,
      },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
      },
    )

    if (!payload) {
      return writeJson(reply, 404, { message: "Personagem nao encontrado." })
    }

    return writeJson(reply, 200, {
      rpgId: payload.rpgId,
      characterId: payload.characterId,
      characterName: payload.characterName,
      classLabel: payload.classLabel,
      abilities: payload.abilities,
    })
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar habilidades.")
  }
}

export async function addNpcMonsterCharacterAbilityHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await addNpcMonsterCharacterAbilityUseCase(
      { service: characterRouteDeps.npcMonsterCharacterAbilityService },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
        payload: parseJsonBody(request.body),
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao adicionar habilidade.")
  }
}

export async function removeNpcMonsterCharacterAbilityHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await removeNpcMonsterCharacterAbilityUseCase(
      { service: characterRouteDeps.npcMonsterCharacterAbilityService },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
        payload: parseJsonBody(request.body),
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover habilidade.")
  }
}
