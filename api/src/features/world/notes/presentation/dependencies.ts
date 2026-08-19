import { prismaNoteLabelsRepository } from "@/features/world/notes/infrastructure/repositories/prismaNoteLabelsRepository"
import { prismaNotesRepository } from "@/features/world/notes/infrastructure/repositories/prismaNotesRepository"
import { base64NotesCursorCodec } from "@/features/world/notes/infrastructure/services/base64NotesCursorCodec"
import { notesAccessService } from "@/features/world/notes/infrastructure/services/notesAccessService"

export const notesRouteDependencies = {
  noteRepository: prismaNotesRepository,
  labelRepository: prismaNoteLabelsRepository,
  cursorCodec: base64NotesCursorCodec,
  accessService: notesAccessService
} as const
