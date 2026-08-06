import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"

import {
  expelMemberHandler,
  getCharacterRequestsHandler,
  listRpgMembersHandler,
  processCharacterRequestHandler,
  processMemberActionHandler,
  requestCharacterCreationHandler,
  requestJoinRpgHandler
} from "@/features/world/presentation/membership/handlers"

export function memberShipRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/members",
    (request, reply) =>
      listRpgMembersHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/members",
    (request, reply) =>
      requestJoinRpgHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/members/:memberId",
    (request, reply) =>
      processMemberActionHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; memberId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/members/:memberId",
    (request, reply) =>
      expelMemberHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; memberId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/character-requests",
    (request, reply) =>
      getCharacterRequestsHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/character-requests",
    (request, reply) =>
      requestCharacterCreationHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/character-requests/:requestId",
    (request, reply) =>
      processCharacterRequestHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; requestId: string }
        }>,
        reply
      )
  )
}
