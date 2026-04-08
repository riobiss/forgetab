import type { FastifyReply, FastifyRequest } from "fastify"
import {
  getCharacterInventoryUseCase,
  removeCharacterInventoryItemApiUseCase,
} from "@/application/characters/inventory/use-cases/manageCharacterInventory"
import { updateCharacterStatusCurrentUseCase } from "@/application/characters/statusCurrent/use-cases/characterStatusCurrent"
import { characterRouteDeps } from "./dependencies"
import {
  mapCharacterInventoryError,
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "./http"
import type { CharacterInventoryRouteParams } from "./routeTypes"

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
