import type { FastifyReply, FastifyRequest } from "fastify"
import { setMarkerSectionLink } from "@/features/world/location/application/use-cases/setMarkerSectionLink"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@/features/http/presentation/fastifyJson"
import { rpgMapRouteDeps } from "./dependencies"

type MarkerSectionLinkRouteParams = {
  rpgId: string
  mapId: string
  markerId: string
}

export async function setMarkerSectionLinkHandler(
  request: FastifyRequest<{ Params: MarkerSectionLinkRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = parseJsonBody(request.body)
    const marker =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).marker
        : null
    const payload = await setMarkerSectionLink(
      rpgMapRouteDeps.markerSectionLinkRepository,
      rpgMapRouteDeps.accessService,
      {
        rpgId: request.params.rpgId,
        mapId: request.params.mapId,
        userId: auth.userId,
        body: {
          ...(body as Record<string, unknown>),
          marker: {
            ...(marker as Record<string, unknown>),
            id: request.params.markerId,
          },
        },
      },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao vincular marcador.")
  }
}
