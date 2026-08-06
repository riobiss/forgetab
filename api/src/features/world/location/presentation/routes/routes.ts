import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"

import {
  createRpgMapHandler,
  createRpgMapMarkerGroupHandler,
  createRpgMapSectionHandler,
  deleteRpgMapHandler,
  deleteRpgMapMarkerGroupHandler,
  deleteRpgMapSectionHandler,
  getRpgMapDetailHandler,
  listRpgMapsHandler,
  reorderRpgMapSectionHandler,
  setMarkerSectionLinkHandler,
  updateRpgMapHandler,
  updateRpgMapMarkerGroupHandler,
  updateRpgMapMarkerHandler,
  updateRpgMapSectionHandler
} from "@/features/world/location/presentation/handlers"

export function locationRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/maps", (request, reply) =>
    listRpgMapsHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply
    )
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps", (request, reply) =>
    createRpgMapHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply
    )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/maps/:mapId",
    (request, reply) =>
      getRpgMapDetailHandler(
        request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/maps/:mapId",
    (request, reply) =>
      updateRpgMapHandler(
        request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/maps/:mapId",
    (request, reply) =>
      deleteRpgMapHandler(
        request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/maps/:mapId/sections",
    (request, reply) =>
      createRpgMapSectionHandler(
        request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId",
    (request, reply) =>
      updateRpgMapSectionHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; mapId: string; sectionId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId",
    (request, reply) =>
      deleteRpgMapSectionHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; mapId: string; sectionId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId/reorder",
    (request, reply) =>
      reorderRpgMapSectionHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; mapId: string; sectionId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "put",
    "/api/rpg/:rpgId/maps/:mapId/marker-links/:markerId",
    (request, reply) =>
      setMarkerSectionLinkHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; mapId: string; markerId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/maps/:mapId/marker-groups",
    (request, reply) =>
      createRpgMapMarkerGroupHandler(
        request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/maps/:mapId/marker-groups/:groupId",
    (request, reply) =>
      updateRpgMapMarkerGroupHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; mapId: string; groupId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/maps/:mapId/marker-groups/:groupId/markers/:markerId",
    (request, reply) =>
      updateRpgMapMarkerHandler(
        request as FastifyRequest<{
          Params: {
            rpgId: string
            mapId: string
            groupId: string
            markerId: string
          }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/maps/:mapId/marker-groups/:groupId",
    (request, reply) =>
      deleteRpgMapMarkerGroupHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; mapId: string; groupId: string }
        }>,
        reply
      )
  )
}
