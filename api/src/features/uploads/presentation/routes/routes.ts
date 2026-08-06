import { registerFastifyRoute } from "@/fastifyRoute"
import { FastifyInstance } from "fastify"

import {
  characterImageHandlers,
  itemImageHandlers,
  libraryImageHandlers,
  mapImageHandlers,
  markerImageHandlers,
  profileImageHandlers,
  rpgImageHandlers,
  sectionImageHandlers
} from "@/features/uploads/presentation/handlers"

export function uploadsRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/character-image",
    (request, reply) => characterImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/uploads/character-image",
    (request, reply) => characterImageHandlers.deleteHandler!(request, reply)
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/item-image",
    (request, reply) => itemImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/uploads/item-image",
    (request, reply) => itemImageHandlers.deleteHandler!(request, reply)
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/library-image",
    (request, reply) => libraryImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/map-image",
    (request, reply) => mapImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/uploads/map-image",
    (request, reply) => mapImageHandlers.deleteHandler!(request, reply)
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/marker-image",
    (request, reply) => markerImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/uploads/marker-image",
    (request, reply) => markerImageHandlers.deleteHandler!(request, reply)
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/profile-image",
    (request, reply) => profileImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/uploads/profile-image",
    (request, reply) => profileImageHandlers.deleteHandler!(request, reply)
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/rpg-image",
    (request, reply) => rpgImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/uploads/rpg-image",
    (request, reply) => rpgImageHandlers.deleteHandler!(request, reply)
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/uploads/section-image",
    (request, reply) => sectionImageHandlers.postHandler(request, reply)
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/uploads/section-image",
    (request, reply) => sectionImageHandlers.deleteHandler!(request, reply)
  )
}
