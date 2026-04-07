import type { FastifyReply, FastifyRequest } from "fastify"
import { deleteItem } from "@/application/items/use-cases/deleteItem"
import { getItemById } from "@/application/items/use-cases/getItemById"
import { updateItem } from "@/application/items/use-cases/updateItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/infrastructure/items/services/imageKitItemImageStorageService"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { type ItemRouteParams, requireUserId } from "./shared"

export async function getItemByIdHandler(
  request: FastifyRequest<{ Params: ItemRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getItemById(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: request.params.rpgId, itemId: request.params.itemId, userId: auth.userId },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar item.")
  }
}

export async function updateItemHandler(
  request: FastifyRequest<{ Params: ItemRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body)
    const payload = await updateItem(
      {
        repository: prismaItemRepository,
        permissionService: rpgPermissionService,
        imageStorageService: imageKitItemImageStorageService,
      },
      {
        rpgId: request.params.rpgId,
        itemId: request.params.itemId,
        userId: auth.userId,
        body,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar item.")
  }
}

export async function deleteItemHandler(
  request: FastifyRequest<{ Params: ItemRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteItem(
      {
        repository: prismaItemRepository,
        permissionService: rpgPermissionService,
        imageStorageService: imageKitItemImageStorageService,
      },
      { rpgId: request.params.rpgId, itemId: request.params.itemId, userId: auth.userId },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao deletar item.")
  }
}
