import { AppError } from "@/features/shared/application/errors/AppError"
import type { SaveNoteInput } from "../types"
import type { ListNotesDependencies, NoteDependencies } from "./dependencies"
import { ensureCampaignNotesAccess } from "./ensureCampaignNotesAccess"
import { normalizeNoteInput, normalizePageSize } from "./notesValidation"

export async function listNotes(
  dependencies: ListNotesDependencies,
  input: {
    rpgId: string
    userId: string
    cursor?: string
    limit?: number
    labelId?: string
  }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  const limit = normalizePageSize(input.limit)
  const notes = await dependencies.noteRepository.list(
    input.rpgId,
    input.userId,
    {
      cursor: input.cursor
        ? dependencies.cursorCodec.decode(input.cursor)
        : null,
      limit: limit + 1,
      labelId: input.labelId?.trim() || null
    }
  )
  const hasNextPage = notes.length > limit
  const pageNotes = notes.slice(0, limit)
  return {
    notes: pageNotes,
    nextCursor:
      hasNextPage && pageNotes.length
        ? dependencies.cursorCodec.encode(pageNotes[pageNotes.length - 1])
        : null
  }
}

export async function createNote(
  dependencies: NoteDependencies,
  input: { rpgId: string; userId: string; note: SaveNoteInput }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  const note = await dependencies.noteRepository.create(
    input.rpgId,
    input.userId,
    normalizeNoteInput(input.note)
  )
  return { note }
}

export async function updateNote(
  dependencies: NoteDependencies,
  input: {
    rpgId: string
    userId: string
    noteId: string
    note: SaveNoteInput
  }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  const result = await dependencies.noteRepository.update(
    input.rpgId,
    input.userId,
    input.noteId,
    normalizeNoteInput(input.note)
  )
  if (result.kind === "not_found") {
    throw new AppError("Nota nao encontrada.", 404)
  }
  if (result.kind === "conflict") {
    throw new AppError(
      "A nota foi alterada em outro local. Recarregue antes de salvar novamente.",
      409
    )
  }
  return { note: result.note }
}

export async function deleteNote(
  dependencies: NoteDependencies,
  input: { rpgId: string; userId: string; noteId: string }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  const deleted = await dependencies.noteRepository.delete(
    input.rpgId,
    input.userId,
    input.noteId
  )
  if (!deleted) throw new AppError("Nota nao encontrada.", 404)
  return { message: "Nota excluida." }
}
