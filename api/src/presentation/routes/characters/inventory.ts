import {
  getCharacterInventoryUseCase,
  removeCharacterInventoryItemApiUseCase,
} from "@/application/characterInventory/use-cases/manageCharacterInventory"
import { updateCharacterStatusCurrentUseCase } from "@/application/characterStatusCurrent/use-cases/characterStatusCurrent"
import { prismaCharacterInventoryRepository } from "@/infrastructure/characterInventory/repositories/prismaCharacterInventoryRepository"
import { prismaCharacterStatusCurrentRepository } from "@/infrastructure/characterStatusCurrent/repositories/prismaCharacterStatusCurrentRepository"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"
import {
  type CharacterInventoryRouteParams,
  mapCharacterInventoryError,
  requireUserId,
} from "./shared"

export async function getCharacterInventoryHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await getCharacterInventoryUseCase(
      { repository: prismaCharacterInventoryRepository },
      { rpgId: params.rpgId, characterId: params.characterId, userId: auth.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return mapCharacterInventoryError(error, "Erro interno ao consultar inventario.")
  }
}

export async function createCharacterInventoryHandler() {
  return jsonResponse(
    { message: "Dar item por esta rota foi desativado. Use a pagina de itens do RPG." },
    { status: 405 },
  )
}

export async function removeCharacterInventoryHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = (await request.json()) as {
      inventoryItemId?: string
      quantity?: number
    }

    const payload = await removeCharacterInventoryItemApiUseCase(
      { repository: prismaCharacterInventoryRepository },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
        inventoryItemId: body.inventoryItemId?.trim() ?? "",
        quantity: Number.isFinite(body.quantity) ? Math.floor(body.quantity as number) : 1,
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return mapCharacterInventoryError(error, "Erro interno ao remover item do inventario.")
  }
}

export async function updateCharacterStatusCurrentHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = (await request.json()) as { key?: unknown; value?: unknown }

    const payload = await updateCharacterStatusCurrentUseCase(
      prismaCharacterStatusCurrentRepository,
      { rpgId: params.rpgId, characterId: params.characterId, userId: auth.userId, body },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return jsonResponse(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "current_statuses" does not exist')) {
      return jsonResponse(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return toErrorResponse(error, "Erro interno ao salvar status atual.")
  }
}
