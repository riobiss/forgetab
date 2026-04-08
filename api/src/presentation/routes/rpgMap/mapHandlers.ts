import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createRpgMap,
  deleteRpgMap,
  getRpgMapDetail,
  listRpgMaps,
  updateRpgMap,
} from "@/application/rpg/map/use-cases/rpgMap"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { rpgMapRouteDeps } from "./dependencies"
import type { MapRouteParams, RpgRouteParams } from "./routeTypes"

export async function listRpgMapsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await listRpgMaps(rpgMapRouteDeps.repository, rpgMapRouteDeps.accessService, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar mapas.")
  }
}

export async function createRpgMapHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const payload = await createRpgMap(rpgMapRouteDeps.repository, rpgMapRouteDeps.accessService, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      body,
    })
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar mapa.")
  }
}

export async function getRpgMapDetailHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getRpgMapDetail(rpgMapRouteDeps.repository, rpgMapRouteDeps.accessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar mapa.")
  }
}

export async function updateRpgMapHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const payload = await updateRpgMap(rpgMapRouteDeps.repository, rpgMapRouteDeps.accessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
      body,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar mapa.")
  }
}

export async function deleteRpgMapHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await deleteRpgMap(rpgMapRouteDeps.repository, rpgMapRouteDeps.accessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover mapa.")
  }
}
