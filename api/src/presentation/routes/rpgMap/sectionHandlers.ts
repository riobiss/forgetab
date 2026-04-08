import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createRpgMapSection,
  deleteRpgMapSection,
  reorderRpgMapSection,
  updateRpgMapSection,
} from "@/application/rpg/map/use-cases/rpgMap"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { rpgMapRouteDeps } from "./dependencies"
import type { MapRouteParams, SectionRouteParams } from "./routeTypes"

export async function createRpgMapSectionHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const payload = await createRpgMapSection(
      rpgMapRouteDeps.repository,
      rpgMapRouteDeps.accessService,
      { rpgId: request.params.rpgId, mapId: request.params.mapId, userId: auth.userId, body },
    )
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar secao.")
  }
}

export async function updateRpgMapSectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const payload = await updateRpgMapSection(
      rpgMapRouteDeps.repository,
      rpgMapRouteDeps.accessService,
      {
        rpgId: request.params.rpgId,
        mapId: request.params.mapId,
        sectionId: request.params.sectionId,
        userId: auth.userId,
        body,
      },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar secao.")
  }
}

export async function deleteRpgMapSectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await deleteRpgMapSection(
      rpgMapRouteDeps.repository,
      rpgMapRouteDeps.accessService,
      {
        rpgId: request.params.rpgId,
        mapId: request.params.mapId,
        sectionId: request.params.sectionId,
        userId: auth.userId,
      },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover secao.")
  }
}

export async function reorderRpgMapSectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const payload = await reorderRpgMapSection(
      rpgMapRouteDeps.repository,
      rpgMapRouteDeps.accessService,
      {
        rpgId: request.params.rpgId,
        mapId: request.params.mapId,
        sectionId: request.params.sectionId,
        userId: auth.userId,
        body,
      },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao reordenar secao.")
  }
}
