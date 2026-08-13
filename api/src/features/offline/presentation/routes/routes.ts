import type { FastifyInstance } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"
import { getOfflineSnapshotHandler } from "../handlers"

export function offlineRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "get",
    "/api/offline/snapshot",
    getOfflineSnapshotHandler
  )
}
