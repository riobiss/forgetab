import { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"

import {
  getProfileHandler,
  updateProfileHandler,
  updateRpgProfileHandler
} from "../handlers"

export function profileRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/profile", (request, reply) =>
    getProfileHandler(request, reply)
  )
  registerFastifyRoute(app, "patch", "/api/profile", (request, reply) =>
    updateProfileHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/profile/rpg/:rpgId",
    (request, reply) =>
      updateRpgProfileHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
}
