import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/shared/errors/AppError"
import { loadRpgCatalogUseCase } from "@/application/rpgCatalog/use-cases/rpgCatalog"
import { loadRpgDashboard } from "@/application/rpgDashboard/use-cases/loadRpgDashboard"
import { createRpg } from "@/application/rpgManagement/use-cases/createRpg"
import { deleteRpg } from "@/application/rpgManagement/use-cases/deleteRpg"
import { getRpgById } from "@/application/rpgManagement/use-cases/getRpgById"
import { updateRpg } from "@/application/rpgManagement/use-cases/updateRpg"
import { prismaRpgCatalogRepository } from "@/infrastructure/rpgCatalog/repositories/prismaRpgCatalogRepository"
import { prismaRpgDashboardRepository } from "@/infrastructure/rpgDashboard/repositories/prismaRpgDashboardRepository"
import { rpgDashboardAccessService } from "@/infrastructure/rpgDashboard/services/rpgDashboardAccessService"
import { imageKitGateway } from "@/infrastructure/rpgManagement/gateways/imageKitGateway"
import { prismaRpgRepository } from "@/infrastructure/rpgManagement/repositories/prismaRpgRepository"
import { legacyRpgPermissionService } from "@/infrastructure/rpgManagement/services/legacyRpgPermissionService"
import { getAuthPayloadFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"

type RpgRouteParams = {
  rpgId: string
}

const dependencies = {
  repository: prismaRpgRepository,
  permissionService: legacyRpgPermissionService,
  imageGateway: imageKitGateway,
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

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)
  if (!authPayload) {
    return {
      ok: false as const,
      response: writeJson(reply, 401, { message: "Usuario nao autenticado." }),
    }
  }

  return { ok: true as const, authPayload }
}

export async function createRpgHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireAuth(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await createRpg(
      { repository: prismaRpgRepository },
      { userId: auth.authPayload.userId, body: parseJsonBody(request.body) },
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar RPG.")
  }
}

export async function listRpgCatalogHandler(request: FastifyRequest, reply: FastifyReply) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)

  try {
    const payload = await loadRpgCatalogUseCase(prismaRpgCatalogRepository, {
      userId: authPayload?.userId ?? null,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar catalogo de RPGs.")
  }
}

export async function getRpgDashboardHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)

  try {
    const payload = await loadRpgDashboard(
      prismaRpgDashboardRepository,
      rpgDashboardAccessService,
      {
        rpgId: request.params.rpgId,
        userId: authPayload?.userId ?? null,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar dashboard do RPG.")
  }
}

export async function getRpgByIdHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireAuth(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getRpgById(
      {
        repository: dependencies.repository,
        permissionService: dependencies.permissionService,
      },
      { rpgId: request.params.rpgId, userId: auth.authPayload.userId },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar RPG.")
  }
}

export async function updateRpgHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireAuth(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await updateRpg(dependencies, {
      rpgId: request.params.rpgId,
      userId: auth.authPayload.userId,
      body: parseJsonBody(request.body),
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar RPG.")
  }
}

export async function deleteRpgHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireAuth(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteRpg(
      {
        repository: dependencies.repository,
        imageGateway: dependencies.imageGateway,
      },
      { rpgId: request.params.rpgId, userId: auth.authPayload.userId },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao deletar RPG.")
  }
}
