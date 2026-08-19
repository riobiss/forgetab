import type { NotesCursor } from "../types"
import type { Note } from "../../domain/Note"

export interface NotesCursorCodec {
  decode(value: string): NotesCursor
  encode(note: Pick<Note, "id" | "updatedAt">): string
}
