import type {
  NotesPageContract,
  SaveNoteContract
} from "@forgetab/world-contracts/notes"
import type { Note, NoteLabel } from "../../domain/Note"

export type NotePayload = SaveNoteContract

export type NotesPageOptions = {
  cursor?: string | null
  limit?: number
  labelId?: string | null
}

export type NotesPage = NotesPageContract

export interface NotesGateway {
  list(rpgId: string, options?: NotesPageOptions): Promise<NotesPage>
  create(rpgId: string, payload: NotePayload): Promise<Note>
  update(rpgId: string, noteId: string, payload: NotePayload): Promise<Note>
  delete(rpgId: string, noteId: string): Promise<void>
}

export interface NoteLabelsGateway {
  listLabels(rpgId: string): Promise<NoteLabel[]>
  createLabel(rpgId: string, name: string): Promise<NoteLabel>
  updateLabel(rpgId: string, labelId: string, name: string): Promise<NoteLabel>
  deleteLabel(rpgId: string, labelId: string): Promise<void>
}

export type NotesFeatureGateway = NotesGateway & NoteLabelsGateway
