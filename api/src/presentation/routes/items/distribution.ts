import type { FastifyReply, FastifyRequest } from "fastify"
import { getItemsDashboardData } from "@/application/items/use-cases/getItemsDashboardData"
import { giveItem } from "@/application/items/use-cases/giveItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { type RpgRouteParams, requireUserId } from "./shared"

export async function getItemsDashboardHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getItemsDashboardData(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: request.params.rpgId, userId: auth.userId },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar dashboard de itens.")
  }
}

export async function giveItemHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body)
    const payload = await giveItem(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: request.params.rpgId, userId: auth.userId, body },
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao dar item para os players.")
  }
}
