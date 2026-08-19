import type {
  ListNotesOptions,
  NoteUpdateResult,
  SaveNoteInput
} from "../types"
import type { Note } from "../../domain/Note"

export interface NotesRepository {
  list(
    rpgId: string,
    userId: string,
    options: ListNotesOptions
  ): Promise<Note[]>
  create(rpgId: string, userId: string, input: SaveNoteInput): Promise<Note>
  update(
    rpgId: string,
    userId: string,
    noteId: string,
    input: SaveNoteInput
  ): Promise<NoteUpdateResult>
  delete(rpgId: string, userId: string, noteId: string): Promise<boolean>
}
