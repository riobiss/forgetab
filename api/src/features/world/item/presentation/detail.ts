import type { FastifyReply, FastifyRequest } from "fastify"
import { deleteItem } from "@/features/world/item/application/use-cases/deleteItem"
import { getItemById } from "@/features/world/item/application/use-cases/getItemById"
import { updateItem } from "@/features/world/item/application/use-cases/updateItem"
import {
  parseJsonBody,
  writeError,
  writeJson,
} from "@/features/http/presentation/fastifyJson"
import { itemRouteDeps } from "./dependencies"
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
      {
        repository: itemRouteDeps.repository,
        permissionService: itemRouteDeps.permissionService,
      },
      {
        rpgId: request.params.rpgId,
        itemId: request.params.itemId,
        userId: auth.userId,
      },
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
        repository: itemRouteDeps.repository,
        permissionService: itemRouteDeps.permissionService,
        imageStorageService: itemRouteDeps.imageStorageService,
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
        repository: itemRouteDeps.repository,
        permissionService: itemRouteDeps.permissionService,
        imageStorageService: itemRouteDeps.imageStorageService,
      },
      {
        rpgId: request.params.rpgId,
        itemId: request.params.itemId,
        userId: auth.userId,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao deletar item.")
  }
}
