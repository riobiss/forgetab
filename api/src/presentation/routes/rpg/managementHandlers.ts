import type { FastifyReply, FastifyRequest } from "fastify"
import { createRpg } from "@/application/rpg/management/use-cases/createRpg"
import { deleteRpg } from "@/application/rpg/management/use-cases/deleteRpg"
import { getRpgById } from "@/application/rpg/management/use-cases/getRpgById"
import { updateRpg } from "@/application/rpg/management/use-cases/updateRpg"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { requireAuth } from "./auth"
import { rpgRouteDeps } from "./dependencies"
import type { RpgRouteParams } from "./routeTypes"

export async function createRpgHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireAuth(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await createRpg(
      { repository: rpgRouteDeps.repository },
      { userId: auth.authPayload.userId, body: parseJsonBody(request.body) },
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar RPG.")
  }
}

export async function getRpgByIdHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireAuth(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await getRpgById(
      {
        repository: rpgRouteDeps.repository,
        permissionService: rpgRouteDeps.permissionService,
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
  if (!auth.ok) return auth.response

  try {
    const payload = await updateRpg(
      {
        repository: rpgRouteDeps.repository,
        permissionService: rpgRouteDeps.permissionService,
        imageGateway: rpgRouteDeps.imageGateway,
      },
      {
        rpgId: request.params.rpgId,
        userId: auth.authPayload.userId,
        body: parseJsonBody(request.body),
      },
    )

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
  if (!auth.ok) return auth.response

  try {
    const payload = await deleteRpg(
      {
        repository: rpgRouteDeps.repository,
        imageGateway: rpgRouteDeps.imageGateway,
      },
      { rpgId: request.params.rpgId, userId: auth.authPayload.userId },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao deletar RPG.")
  }
}
