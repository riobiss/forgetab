import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createNote,
  deleteNote,
  listNotes,
  updateNote
} from "@/features/world/notes/application/use-cases/notes"
import {
  createNoteLabel,
  deleteNoteLabel,
  listNoteLabels,
  updateNoteLabel
} from "@/features/world/notes/application/use-cases/noteLabels"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson
} from "@/features/http/presentation/fastifyJson"
import { notesRouteDependencies } from "./dependencies"
import {
  parseNoteLabelRequest,
  parseNotesLimit,
  parseSaveNoteRequest
} from "./requestParsers"

type RpgParams = { rpgId: string }
type NotesQuery = { cursor?: string; limit?: string; labelId?: string }
type NoteParams = RpgParams & { noteId: string }
type LabelParams = RpgParams & { labelId: string }

export async function listNotesHandler(
  request: FastifyRequest<{ Params: RpgParams; Querystring: NotesQuery }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    return writeJson(
      reply,
      200,
      await listNotes(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        cursor: request.query.cursor,
        limit: parseNotesLimit(request.query.limit),
        labelId: request.query.labelId
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar notas.")
  }
}

export async function createNoteHandler(
  request: FastifyRequest<{ Params: RpgParams }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    return writeJson(
      reply,
      201,
      await createNote(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        note: parseSaveNoteRequest(parseJsonBody(request.body))
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar nota.")
  }
}

export async function updateNoteHandler(
  request: FastifyRequest<{ Params: NoteParams }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    return writeJson(
      reply,
      200,
      await updateNote(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        noteId: request.params.noteId,
        userId: auth.userId,
        note: parseSaveNoteRequest(parseJsonBody(request.body))
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar nota.")
  }
}

export async function deleteNoteHandler(
  request: FastifyRequest<{ Params: NoteParams }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response
  try {
    return writeJson(
      reply,
      200,
      await deleteNote(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        noteId: request.params.noteId,
        userId: auth.userId
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao excluir nota.")
  }
}

export async function listNoteLabelsHandler(
  request: FastifyRequest<{ Params: RpgParams }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response
  try {
    return writeJson(
      reply,
      200,
      await listNoteLabels(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        userId: auth.userId
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar marcadores.")
  }
}

export async function createNoteLabelHandler(
  request: FastifyRequest<{ Params: RpgParams }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response
  try {
    return writeJson(
      reply,
      201,
      await createNoteLabel(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        name: parseNoteLabelRequest(parseJsonBody(request.body))
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar marcador.")
  }
}

export async function updateNoteLabelHandler(
  request: FastifyRequest<{ Params: LabelParams }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response
  try {
    return writeJson(
      reply,
      200,
      await updateNoteLabel(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        labelId: request.params.labelId,
        userId: auth.userId,
        name: parseNoteLabelRequest(parseJsonBody(request.body))
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar marcador.")
  }
}

export async function deleteNoteLabelHandler(
  request: FastifyRequest<{ Params: LabelParams }>,
  reply: FastifyReply
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response
  try {
    return writeJson(
      reply,
      200,
      await deleteNoteLabel(notesRouteDependencies, {
        rpgId: request.params.rpgId,
        labelId: request.params.labelId,
        userId: auth.userId
      })
    )
  } catch (error) {
    return writeError(reply, error, "Erro interno ao excluir marcador.")
  }
}
