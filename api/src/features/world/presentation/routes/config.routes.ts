import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"

import {
  getAttributeTemplatesHandler,
  getCharacteristicTemplatesHandler,
  getClassTemplatesHandler,
  getIdentityTemplatesHandler,
  getRaceTemplatesHandler,
  getSkillTemplatesHandler,
  getStatusTemplatesHandler,
  updateAttributeTemplatesHandler,
  updateCharacteristicTemplatesHandler,
  updateClassTemplatesHandler,
  updateIdentityTemplatesHandler,
  updateRaceTemplatesHandler,
  updateSkillTemplatesHandler,
  updateStatusTemplatesHandler
} from "@/features/world/presentation/config/handlers"

export function configRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/attributes",
    (request, reply) =>
      getAttributeTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "put",
    "/api/rpg/:rpgId/attributes",
    (request, reply) =>
      updateAttributeTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/statuses",
    (request, reply) =>
      getStatusTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "put",
    "/api/rpg/:rpgId/statuses",
    (request, reply) =>
      updateStatusTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/skills", (request, reply) =>
    getSkillTemplatesHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply
    )
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/skills", (request, reply) =>
    updateSkillTemplatesHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply
    )
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/races", (request, reply) =>
    getRaceTemplatesHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply
    )
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/races", (request, reply) =>
    updateRaceTemplatesHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply
    )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/classes",
    (request, reply) =>
      getClassTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "put",
    "/api/rpg/:rpgId/classes",
    (request, reply) =>
      updateClassTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/character-identity",
    (request, reply) =>
      getIdentityTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "put",
    "/api/rpg/:rpgId/character-identity",
    (request, reply) =>
      updateIdentityTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/character-characteristics",
    (request, reply) =>
      getCharacteristicTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "put",
    "/api/rpg/:rpgId/character-characteristics",
    (request, reply) =>
      updateCharacteristicTemplatesHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
}
