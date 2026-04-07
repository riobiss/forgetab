import type { FastifyReply, FastifyRequest } from "fastify"
import { createItem } from "@/application/items/use-cases/createItem"
import { getItems } from "@/application/items/use-cases/getItems"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { type RpgRouteParams, requireUserId } from "./shared"

export function getItemsPayload(rpgId: string, userId: string) {
  return getItems(
    { repository: prismaItemRepository, permissionService: rpgPermissionService },
    { rpgId, userId },
  )
}

export async function listItemsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getItemsPayload(request.params.rpgId, auth.userId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar itens.")
  }
}

export async function createItemHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body)
    const payload = await createItem(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: request.params.rpgId, userId: auth.userId, body },
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar item.")
  }
}
