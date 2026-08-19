import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"
import {
  createNoteLabelHandler,
  createNoteHandler,
  deleteNoteHandler,
  deleteNoteLabelHandler,
  listNoteLabelsHandler,
  listNotesHandler,
  updateNoteLabelHandler,
  updateNoteHandler
} from "../handlers"

export function notesRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/notes", (request, reply) =>
    listNotesHandler(
      request as FastifyRequest<{
        Params: { rpgId: string }
        Querystring: { cursor?: string; limit?: string; labelId?: string }
      }>,
      reply
    )
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/notes", (request, reply) =>
    createNoteHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply
    )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/notes/:noteId",
    (request, reply) =>
      updateNoteHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; noteId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/notes/:noteId",
    (request, reply) =>
      deleteNoteHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; noteId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/note-labels",
    (request, reply) =>
      listNoteLabelsHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/note-labels",
    (request, reply) =>
      createNoteLabelHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/note-labels/:labelId",
    (request, reply) =>
      updateNoteLabelHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; labelId: string }
        }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/note-labels/:labelId",
    (request, reply) =>
      deleteNoteLabelHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; labelId: string }
        }>,
        reply
      )
  )
}
