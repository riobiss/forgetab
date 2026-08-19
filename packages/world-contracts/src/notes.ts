export const NOTE_TITLE_MAX_LENGTH = 120
export const NOTE_CONTENT_MAX_LENGTH = 50_000
export const NOTE_LABEL_MAX_LENGTH = 50
export const NOTES_DEFAULT_PAGE_SIZE = 30
export const NOTES_MAX_PAGE_SIZE = 100

export type NoteLabelContract = {
  id: string
  name: string
}

export type NoteContract = {
  id: string
  clientId: string | null
  title: string
  content: string
  revision: number
  createdAt: string
  updatedAt: string
  labels: NoteLabelContract[]
}

export type SaveNoteContract = {
  title: string
  content: string
  labelIds: string[]
  clientId?: string | null
  baseRevision?: number | null
}

export type NotesPageContract = {
  notes: NoteContract[]
  nextCursor: string | null
}
