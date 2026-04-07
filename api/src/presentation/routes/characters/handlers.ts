import type { FastifyReply, FastifyRequest } from "fastify"
import {
  grantCharacterPointsUseCase,
  grantCharacterXpUseCase,
} from "@/application/characters/progression/use-cases/characterProgression"
import {
  getCharacterInventoryUseCase,
  removeCharacterInventoryItemApiUseCase,
} from "@/application/characters/inventory/use-cases/manageCharacterInventory"
import { updateCharacterStatusCurrentUseCase } from "@/application/characters/statusCurrent/use-cases/characterStatusCurrent"
import { loadCharacterAbilitiesUseCase } from "@/application/characters/abilities/use-cases/characterAbilities"
import {
  addNpcMonsterCharacterAbilityUseCase,
  removeNpcMonsterCharacterAbilityUseCase,
} from "@/application/characters/abilities/use-cases/npcMonsterCharacterAbilities"
import {
  buyCharacterSkillUseCase,
  removeCharacterSkillUseCase,
} from "@/application/characters/abilities/use-cases/characterSkillPurchase"
import { createCharacter } from "@/application/characters/use-cases/createCharacter"
import { deleteCharacter } from "@/application/characters/use-cases/deleteCharacter"
import { getEditableCharacter } from "@/application/characters/use-cases/getEditableCharacter"
import { getRpgAccess } from "@/application/characters/use-cases/getRpgAccess"
import { listCharacters } from "@/application/characters/use-cases/listCharacters"
import {
  updateCharacter,
  type UpdateCharacterPayload,
} from "@/application/characters/use-cases/updateCharacter"
import { loadCharactersDashboardUseCase } from "@/application/characters/dashboard/use-cases/loadCharactersDashboard"
import { loadCharacterDetailUseCase } from "@/application/characters/detail/use-cases/loadCharacterDetail"
import { characterRouteDeps, loadCharactersDashboardContext } from "./dependencies"
import {
  mapCharacterCollectionError,
  mapCharacterInventoryError,
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "./http"

export type CharacterRouteParams = {
  id: string
}

export type CharacterInventoryRouteParams = {
  rpgId: string
  characterId: string
}

export type CharactersCollectionRouteParams = {
  rpgId: string
}

type CharactersDashboardQuery = {
  type?: string
  modal?: string
  viewer?: string
  characterId?: string
}

const characterProgressionDeps = {
  repository: characterRouteDeps.characterProgressionRepository,
  permissionService: characterRouteDeps.characterProgressionPermissionService,
}

function normalizeFilterType(value?: string) {
  return value === "player" || value === "npc" || value === "monster" ? value : "all"
}

export async function getCharactersDashboardHandler(
  request: FastifyRequest<{
    Params: CharactersCollectionRouteParams
    Querystring: CharactersDashboardQuery
  }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  const userId = auth.ok ? auth.userId : null
  const filterType = normalizeFilterType(request.query.type)

  try {
    const { editorBootstrap, selectedCharacterDetail } = await loadCharactersDashboardContext({
      rpgId: request.params.rpgId,
      userId,
      filterType,
      modal: request.query.modal,
      viewer: request.query.viewer,
      characterId: request.query.characterId,
    })

    const result = await loadCharactersDashboardUseCase(
      {
        dashboardRepository: characterRouteDeps.charactersDashboardRepository,
        rpgAccessRepository: characterRouteDeps.rpgAccessRepository,
      },
      {
        rpgId: request.params.rpgId,
        userId,
        filterType,
        editorBootstrap,
        selectedCharacterDetail,
      },
    )

    if (result.status === "not_found" || result.status === "private_blocked") {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }

    return writeJson(reply, 200, result.data)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar dashboard de personagens.")
  }
}

export async function grantCharacterXpHandler(
  request: FastifyRequest<{ Params: CharacterRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = (parseJsonBody(request.body) ?? {}) as { amount?: unknown }
    const payload = await grantCharacterXpUseCase(characterProgressionDeps, {
      characterId: request.params.id,
      userId: auth.userId,
      amount: body.amount,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao conceder XP.")
  }
}

export async function grantCharacterPointsHandler(
  request: FastifyRequest<{ Params: CharacterRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = (parseJsonBody(request.body) ?? {}) as { amount?: unknown }
    const payload = await grantCharacterPointsUseCase(characterProgressionDeps, {
      characterId: request.params.id,
      userId: auth.userId,
      amount: body.amount,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao conceder pontos.")
  }
}

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

export async function getCharacterInventoryHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await getCharacterInventoryUseCase(
      { repository: characterRouteDeps.characterInventoryRepository },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return mapCharacterInventoryError(reply, error, "Erro interno ao consultar inventario.")
  }
}

export async function createCharacterInventoryHandler(reply: FastifyReply) {
  return writeJson(reply, 405, {
    message: "Dar item por esta rota foi desativado. Use a pagina de itens do RPG.",
  })
}

export async function removeCharacterInventoryHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = (parseJsonBody(request.body) ?? {}) as {
      inventoryItemId?: string
      quantity?: number
    }

    const payload = await removeCharacterInventoryItemApiUseCase(
      { repository: characterRouteDeps.characterInventoryRepository },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
        inventoryItemId: body.inventoryItemId?.trim() ?? "",
        quantity: Number.isFinite(body.quantity) ? Math.floor(body.quantity as number) : 1,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return mapCharacterInventoryError(
      reply,
      error,
      "Erro interno ao remover item do inventario.",
    )
  }
}

export async function updateCharacterStatusCurrentHandler(
  request: FastifyRequest<{ Params: CharacterInventoryRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = (parseJsonBody(request.body) ?? {}) as { key?: unknown; value?: unknown }

    const payload = await updateCharacterStatusCurrentUseCase(
      characterRouteDeps.characterStatusCurrentRepository,
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
        body,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return writeJson(reply, 500, {
        message: "Tabela de personagens nao existe no banco. Rode a migration.",
      })
    }
    if (error instanceof Error && error.message.includes('column "current_statuses" does not exist')) {
      return writeJson(reply, 500, {
        message: "Estrutura de personagens desatualizada. Rode a migration mais recente.",
      })
    }

    return writeError(reply, error, "Erro interno ao salvar status atual.")
  }
}

export async function listCharactersHandler(
  request: FastifyRequest<{ Params: CharactersCollectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      repository: characterRouteDeps.rpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }

    const payload = await listCharacters({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      access,
      characterRepository: characterRouteDeps.characterRepository,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return mapCharacterCollectionError(reply, error, "Erro interno ao listar personagens.")
  }
}

export async function createCharacterHandler(
  request: FastifyRequest<{ Params: CharactersCollectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      repository: characterRouteDeps.rpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }

    const body = parseJsonBody(request.body)
    const character = await createCharacter({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      access,
      payload: body,
      characterRepository: characterRouteDeps.characterRepository,
      rpgTemplatesRepository: characterRouteDeps.rpgTemplatesRepository,
    })

    return writeJson(reply, 201, { character })
  } catch (error) {
    return mapCharacterCollectionError(reply, error, "Erro interno ao criar personagem.")
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

