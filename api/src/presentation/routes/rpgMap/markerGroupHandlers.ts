import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createRpgMapMarkerGroup,
  deleteRpgMapMarkerGroup,
  updateRpgMapMarkerGroup,
} from "@/application/rpg/map/use-cases/rpgMap"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { rpgMapRouteDeps } from "./dependencies"
import type { GroupRouteParams, MapRouteParams } from "./routeTypes"

export async function createRpgMapMarkerGroupHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const payload = await createRpgMapMarkerGroup(
      rpgMapRouteDeps.repository,
      rpgMapRouteDeps.accessService,
      { rpgId: request.params.rpgId, mapId: request.params.mapId, userId: auth.userId, body },
    )
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar grupo de marcadores.")
  }
}

export async function updateRpgMapMarkerGroupHandler(
  request: FastifyRequest<{ Params: GroupRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const payload = await updateRpgMapMarkerGroup(
      rpgMapRouteDeps.repository,
      rpgMapRouteDeps.accessService,
      {
        rpgId: request.params.rpgId,
        mapId: request.params.mapId,
        groupId: request.params.groupId,
        userId: auth.userId,
        body,
      },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar grupo de marcadores.")
  }
}

export async function deleteRpgMapMarkerGroupHandler(
  request: FastifyRequest<{ Params: GroupRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await deleteRpgMapMarkerGroup(
      rpgMapRouteDeps.repository,
      rpgMapRouteDeps.accessService,
      {
        rpgId: request.params.rpgId,
        mapId: request.params.mapId,
        groupId: request.params.groupId,
        userId: auth.userId,
      },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover grupo de marcadores.")
  }
}
