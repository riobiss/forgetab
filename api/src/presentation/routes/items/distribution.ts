import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/shared/errors/AppError"
import { getItemsDashboardData } from "@/application/items/use-cases/getItemsDashboardData"
import { giveItem } from "@/application/items/use-cases/giveItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { type RpgRouteParams, requireUserId } from "./shared"

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
