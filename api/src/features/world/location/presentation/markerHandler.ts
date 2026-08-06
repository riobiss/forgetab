import type { FastifyReply, FastifyRequest } from "fastify"
import { updateRpgMapMarker } from "@/features/world/location/application/use-cases/updateRpgMapMarker"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson
} from "@/features/http/presentation/fastifyJson"
import { rpgMapRouteDeps } from "./dependencies"

type MarkerRouteParams = {
  rpgId: string
  mapId: string
  groupId: string
  markerId: string
}

export async function updateRpgMapMarkerHandler(
  request: FastifyRequest<{ Params: MarkerRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await updateRpgMapMarker(
      rpgMapRouteDeps.markerRepository,
      rpgMapRouteDeps.accessService,
      {
        ...request.params,
        userId: auth.userId,
        body: parseJsonBody(request.body)
      }
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar marcador.")
  }
}
