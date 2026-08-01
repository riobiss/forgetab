import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"
import {
  getClassCatalogDetailHandler,
  getClassCatalogPageHandler,
  getRaceCatalogDetailHandler,
  getRaceCatalogPageHandler,
} from "@/features/world/catalog/presentation/handlers"
import type {
  ClassDetailRouteParams,
  EntityCatalogRouteParams,
  RaceDetailRouteParams,
} from "@/features/world/catalog/presentation/routeTypes"

export function catalogRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/entity-catalog/races",
    (request, reply) =>
      getRaceCatalogPageHandler(
        request as FastifyRequest<{ Params: EntityCatalogRouteParams }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/entity-catalog/races/:raceKey",
    (request, reply) =>
      getRaceCatalogDetailHandler(
        request as FastifyRequest<{ Params: RaceDetailRouteParams }>,
        reply,
      ),
  )

  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/entity-catalog/classes",
    (request, reply) =>
      getClassCatalogPageHandler(
        request as FastifyRequest<{ Params: EntityCatalogRouteParams }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/entity-catalog/classes/:classId",
    (request, reply) =>
      getClassCatalogDetailHandler(
        request as FastifyRequest<{ Params: ClassDetailRouteParams }>,
        reply,
      ),
  )
}
