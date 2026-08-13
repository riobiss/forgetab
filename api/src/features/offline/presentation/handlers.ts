import type { FastifyReply, FastifyRequest } from "fastify"
import { loadOfflineSnapshotUseCase } from "@/features/offline/application/use-cases/loadOfflineSnapshot"
import {
  requireUserId,
  writeError,
  writeJson
} from "@/features/http/presentation/fastifyJson"
import { offlineRouteDeps } from "./dependencies"

export async function getOfflineSnapshotHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const snapshot = await loadOfflineSnapshotUseCase(offlineRouteDeps, {
      userId: auth.userId
    })

    return writeJson(reply, 200, snapshot)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao preparar dados offline.")
  }
}
