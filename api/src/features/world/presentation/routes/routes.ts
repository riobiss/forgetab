import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"

import {
  createRpgHandler,
  deleteRpgHandler,
  getRpgDashboardHandler,
  getRpgByIdHandler,
  listRpgCatalogHandler,
  updateRpgHandler,
} from "@/features/world/presentation/handlers"

export function worldRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/rpg", (request, reply) =>
    listRpgCatalogHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg", (request, reply) =>
    createRpgHandler(request, reply),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId", (request, reply) =>
    getRpgByIdHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/dashboard",
    (request, reply) =>
      getRpgDashboardHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId", (request, reply) =>
    updateRpgHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId", (request, reply) =>
    deleteRpgHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply,
    ),
  )
}
