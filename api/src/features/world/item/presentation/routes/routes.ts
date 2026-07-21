import { FastifyInstance, FastifyRequest } from "fastify";
import { registerFastifyRoute } from "@/fastifyRoute";

import {
  createItemHandler,
  deleteItemHandler,
  getItemByIdHandler,
  getItemsDashboardHandler,
  giveItemHandler,
  listItemsHandler,
  updateItemHandler,
} from "@/features/world/item/presentation/handlers"

export function itemRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/items", (request, reply) =>
    listItemsHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/items", (request, reply) =>
    createItemHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/items/dashboard",
    (request, reply) =>
      getItemsDashboardHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/items/give",
    (request, reply) =>
      giveItemHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/items/:itemId",
    (request, reply) =>
      getItemByIdHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; itemId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/items/:itemId",
    (request, reply) =>
      updateItemHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; itemId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/items/:itemId",
    (request, reply) =>
      deleteItemHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; itemId: string }
        }>,
        reply,
      ),
  )
}
