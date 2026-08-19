import type { Note } from "../domain/Note"
import type { SaveNoteContract } from "@forgetab/world-contracts/notes"

export type SaveNoteInput = Required<SaveNoteContract>

export type NoteUpdateResult =
  | { kind: "updated"; note: Note }
  | { kind: "conflict"; note: Note }
  | { kind: "not_found" }

export type NotesCursor = {
  updatedAt: Date
  id: string
}

export type ListNotesOptions = {
  cursor: NotesCursor | null
  limit: number
  labelId: string | null
}
