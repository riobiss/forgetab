import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"
import {
  createLibraryBookHandler,
  createLibrarySectionHandler,
  deleteLibraryBookHandler,
  deleteLibrarySectionHandler,
  getLibraryBookHandler,
  getLibrarySectionHandler,
  listLibrarySectionBooksHandler,
  listLibrarySectionsHandler,
  updateLibraryBookHandler,
  updateLibrarySectionHandler,
} from "@/features/world/library/presentation/handlers"

export function libraryRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/library/sections",
    (request, reply) =>
      listLibrarySectionsHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/library/sections",
    (request, reply) =>
      createLibrarySectionHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/library/sections/:sectionId",
    (request, reply) =>
      getLibrarySectionHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; sectionId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/library/sections/:sectionId",
    (request, reply) =>
      updateLibrarySectionHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; sectionId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/library/sections/:sectionId",
    (request, reply) =>
      deleteLibrarySectionHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; sectionId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/library/sections/:sectionId/books",
    (request, reply) =>
      listLibrarySectionBooksHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; sectionId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/library/sections/:sectionId/books",
    (request, reply) =>
      createLibraryBookHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; sectionId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/library/books/:bookId",
    (request, reply) =>
      getLibraryBookHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; bookId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/library/books/:bookId",
    (request, reply) =>
      updateLibraryBookHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; bookId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/library/books/:bookId",
    (request, reply) =>
      deleteLibraryBookHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; bookId: string }
        }>,
        reply,
      ),
  )
}
