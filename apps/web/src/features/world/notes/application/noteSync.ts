import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"
import type { Note } from "@/features/world/notes/domain/Note"

export function serverNoteToLocal(note: Note): SyncedNote {
  return {
    ...note,
    title: note.title === "Sem titulo" ? "" : note.title,
    localKey: note.clientId ? `client:${note.clientId}` : `server:${note.id}`,
    localVersion: 0,
    isNew: false,
    syncStatus: "saved"
  }
}
