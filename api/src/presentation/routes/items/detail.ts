import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/shared/errors/AppError"
import { deleteItem } from "@/application/items/use-cases/deleteItem"
import { getItemById } from "@/application/items/use-cases/getItemById"
import { updateItem } from "@/application/items/use-cases/updateItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/infrastructure/items/services/imageKitItemImageStorageService"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { type ItemRouteParams, requireUserId } from "./shared"

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
