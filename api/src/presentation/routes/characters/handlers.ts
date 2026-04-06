import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/shared/errors/AppError"
import {
  grantCharacterPointsUseCase,
  grantCharacterXpUseCase,
} from "@/application/characterProgression/use-cases/characterProgression"
import {
  getCharacterInventoryUseCase,
  removeCharacterInventoryItemApiUseCase,
} from "@/application/characterInventory/use-cases/manageCharacterInventory"
import { updateCharacterStatusCurrentUseCase } from "@/application/characterStatusCurrent/use-cases/characterStatusCurrent"
import { loadCharacterAbilitiesUseCase } from "@/application/characterAbilities/use-cases/characterAbilities"
import {
  addNpcMonsterCharacterAbilityUseCase,
  removeNpcMonsterCharacterAbilityUseCase,
} from "@/application/characterAbilities/use-cases/npcMonsterCharacterAbilities"
import {
  buyCharacterSkillUseCase,
  removeCharacterSkillUseCase,
} from "@/application/characterAbilities/use-cases/characterSkillPurchase"
import { createCharacter } from "@/application/characters/use-cases/createCharacter"
import { deleteCharacter } from "@/application/characters/use-cases/deleteCharacter"
import { getRpgAccess } from "@/application/characters/use-cases/getRpgAccess"
import { listCharacters } from "@/application/characters/use-cases/listCharacters"
import {
  updateCharacter,
  type UpdateCharacterPayload,
} from "@/application/characters/use-cases/updateCharacter"
import { loadCharactersDashboardUseCase } from "@/application/charactersDashboard/use-cases/loadCharactersDashboard"
import { loadCharacterEditorBootstrapServerUseCase } from "@/application/charactersEditor/use-cases/loadCharacterEditorBootstrapServer"
import { loadCharacterDetailUseCase } from "@/application/charactersDetail/use-cases/loadCharacterDetail"
import { prismaCharacterAbilitiesRepository } from "@/infrastructure/characterAbilities/repositories/prismaCharacterAbilitiesRepository"
import { legacyCharacterAbilitiesParserService } from "@/infrastructure/characterAbilities/services/legacyCharacterAbilitiesParserService"
import { npcMonsterCharacterAbilityService } from "@/infrastructure/characterAbilities/services/npcMonsterCharacterAbilityService"
import { legacyCharacterSkillPurchaseService } from "@/infrastructure/characterAbilities/services/legacyCharacterSkillPurchaseService"
import { prismaCharacterInventoryRepository } from "@/infrastructure/characterInventory/repositories/prismaCharacterInventoryRepository"
import { prismaCharacterProgressionRepository } from "@/infrastructure/characterProgression/repositories/prismaCharacterProgressionRepository"
import { prismaCharacterStatusCurrentRepository } from "@/infrastructure/characterStatusCurrent/repositories/prismaCharacterStatusCurrentRepository"
import { prismaCharacterRepository } from "@/infrastructure/characters/repositories/prismaCharacterRepository"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaRpgTemplatesRepository } from "@/infrastructure/characters/repositories/prismaRpgTemplatesRepository"
import { prismaCharactersDashboardRepository } from "@/infrastructure/charactersDashboard/repositories/prismaCharactersDashboardRepository"
import { prismaCharacterDetailRepository } from "@/infrastructure/charactersDetail/repositories/prismaCharacterDetailRepository"
import { legacyCharacterDetailPermissionService } from "@/infrastructure/charactersDetail/services/legacyCharacterDetailPermissionService"
import { legacyCharacterManagementService } from "@/infrastructure/characters/services/legacyCharacterManagementService"
import { rpgCharacterProgressionPermissionService } from "@/infrastructure/characterProgression/services/rpgCharacterProgressionPermissionService"
import { prismaRpgConfigRepository } from "@/infrastructure/rpgConfig/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpgConfig/services/rpgConfigAccessService"
import { getUserIdFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"
import { getCharacterEditorSnapshot } from "@/lib/server/characters/getCharacterEditorSnapshot"
import { canManageCharacter } from "@/lib/server/characters/manage/permissions"

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
  repository: prismaCharacterProgressionRepository,
  permissionService: rpgCharacterProgressionPermissionService,
}

function parseJsonBody(body: unknown) {
  if (body == null) {
    return null
  }

  if (Buffer.isBuffer(body)) {
    const raw = body.toString("utf8").trim()
    return raw ? JSON.parse(raw) : null
  }

  if (typeof body === "string") {
    const raw = body.trim()
    return raw ? JSON.parse(raw) : null
  }

  return body
}

function writeJson(reply: FastifyReply, status: number, body: unknown) {
  reply.code(status)
  reply.header("Content-Type", "application/json; charset=utf-8")
  return reply.send(body)
}

function writeError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return writeJson(reply, error.status, { message: error.message })
  }

  return writeJson(reply, 500, { message: fallbackMessage })
}

function mapCharacterInventoryError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
  if (
    error instanceof Error &&
    error.message.includes('relation "rpg_character_inventory_items" does not exist')
  ) {
    return writeJson(
      reply,
      500,
      { message: "Tabela de inventario nao existe no banco. Rode a migration." },
    )
  }

  if (
    error instanceof Error &&
    (error.message.includes('column "description" does not exist') ||
      error.message.includes('column "pre_requirement" does not exist') ||
      error.message.includes('column "duration" does not exist') ||
      error.message.includes('column "image" does not exist'))
  ) {
    return writeJson(
      reply,
      500,
      { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
    )
  }

  return writeError(reply, error, fallbackMessage)
}

function mapCharacterCollectionError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
  if (
    error instanceof Error &&
    (error.message.includes('column "use_inventory_weight_limit" does not exist') ||
      error.message.includes('column "allow_multiple_player_characters" does not exist') ||
      error.message.includes('column "progression_mode" does not exist') ||
      error.message.includes('column "progression_tiers" does not exist'))
  ) {
    return writeJson(
      reply,
      500,
      { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
    )
  }

  return writeError(reply, error, fallbackMessage)
}

async function requireUserId(request: FastifyRequest, reply: FastifyReply) {
  const userId = await getUserIdFromFastifyRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: writeJson(reply, 401, { message: "Usuario nao autenticado." }),
    }
  }

  return { ok: true as const, userId }
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
  const userId = await getUserIdFromFastifyRequest(request)
  const filterType = normalizeFilterType(request.query.type)

  try {
    const editorBootstrap = userId
      ? await loadCharacterEditorBootstrapServerUseCase(
          {
            rpgAccessRepository: prismaRpgAccessRepository,
            rpgTemplatesRepository: prismaRpgTemplatesRepository,
            characterRepository: prismaCharacterRepository,
            rpgConfigRepository: prismaRpgConfigRepository,
            rpgConfigAccessService,
          },
          {
            rpgId: request.params.rpgId,
            userId,
          },
        )
      : null

    const selectedCharacterDetail =
      request.query.modal === "view" &&
      request.query.viewer === "character" &&
      request.query.characterId
        ? await (async () => {
            const selectedCharacterId = request.query.characterId ?? ""
            const detailResult = await loadCharacterDetailUseCase(
              {
                repository: prismaCharacterDetailRepository,
                rpgAccessRepository: prismaRpgAccessRepository,
                permissionService: legacyCharacterDetailPermissionService,
              },
              {
                rpgId: request.params.rpgId,
                characterId: selectedCharacterId,
                userId,
              },
            )

            return detailResult.status === "ok" ? detailResult.data : null
          })()
        : null

    const result = await loadCharactersDashboardUseCase(
      {
        dashboardRepository: prismaCharactersDashboardRepository,
        rpgAccessRepository: prismaRpgAccessRepository,
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
      { service: legacyCharacterSkillPurchaseService },
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
      { service: legacyCharacterSkillPurchaseService },
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
      { repository: prismaCharacterInventoryRepository },
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
      { repository: prismaCharacterInventoryRepository },
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
      prismaCharacterStatusCurrentRepository,
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
      repository: prismaRpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }

    const payload = await listCharacters({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      access,
      characterRepository: prismaCharacterRepository,
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
      repository: prismaRpgAccessRepository,
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
      characterRepository: prismaCharacterRepository,
      rpgTemplatesRepository: prismaRpgTemplatesRepository,
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
    const permission = await canManageCharacter(
      request.params.rpgId,
      request.params.characterId,
      auth.userId,
    )
    if (!permission.ok) {
      return writeJson(reply, permission.status, { message: permission.message })
    }

    const character = await getCharacterEditorSnapshot(
      request.params.rpgId,
      request.params.characterId,
    )
    if (!character) {
      return writeJson(reply, 404, { message: "Personagem nao encontrado." })
    }

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
        repository: prismaCharacterDetailRepository,
        rpgAccessRepository: prismaRpgAccessRepository,
        permissionService: legacyCharacterDetailPermissionService,
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
      { managementService: legacyCharacterManagementService },
      {
        rpgId: request.params.rpgId,
        characterId: request.params.characterId,
        userId: auth.userId,
        payload,
      },
    )

    const updatedCharacter = await getCharacterEditorSnapshot(
      request.params.rpgId,
      request.params.characterId,
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
      { managementService: legacyCharacterManagementService },
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
        repository: prismaCharacterAbilitiesRepository,
        rpgAccessRepository: prismaRpgAccessRepository,
        parserService: legacyCharacterAbilitiesParserService,
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
      { service: npcMonsterCharacterAbilityService },
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
      { service: npcMonsterCharacterAbilityService },
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
