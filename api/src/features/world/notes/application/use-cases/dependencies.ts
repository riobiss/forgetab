import type { NoteLabelsRepository } from "../ports/NoteLabelsRepository"
import type { NotesAccessService } from "../ports/NotesAccessService"
import type { NotesCursorCodec } from "../ports/NotesCursorCodec"
import type { NotesRepository } from "../ports/NotesRepository"

export type AccessDependencies = {
  accessService: NotesAccessService
}

export type NoteDependencies = AccessDependencies & {
  noteRepository: NotesRepository
}

export type ListNotesDependencies = NoteDependencies & {
  cursorCodec: NotesCursorCodec
}

export type LabelDependencies = AccessDependencies & {
  labelRepository: NoteLabelsRepository
}
