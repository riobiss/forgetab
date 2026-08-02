import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"

import {
  createSkillHandler,
  createSkillLevelHandler,
  deleteSkillHandler,
  deleteSkillLevelHandler,
  getSkillByIdHandler,
  getSkillsSearchIndexHandler,
  listSkillsHandler,
  updateSkillHandler,
  updateSkillLevelHandler,
} from "@/features/world/skill/presentation/handlers"

export function skillRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/skills", (request, reply) =>
    listSkillsHandler(
      request as FastifyRequest<{ Querystring: { rpgId?: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/skills", (request, reply) =>
    createSkillHandler(request, reply),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/skills/search-index",
    (request, reply) => getSkillsSearchIndexHandler(request, reply),
  )
  registerFastifyRoute(app, "get", "/api/skills/:id", (request, reply) =>
    getSkillByIdHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/skills/:id", (request, reply) =>
    updateSkillHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/skills/:id", (request, reply) =>
    deleteSkillHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/skills/:id/levels",
    (request, reply) =>
      createSkillLevelHandler(
        request as FastifyRequest<{ Params: { id: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/skills/:id/levels/:levelId",
    (request, reply) =>
      updateSkillLevelHandler(
        request as FastifyRequest<{ Params: { id: string; levelId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/skills/:id/levels/:levelId",
    (request, reply) =>
      deleteSkillLevelHandler(
        request as FastifyRequest<{ Params: { id: string; levelId: string } }>,
        reply,
      ),
  )
}
