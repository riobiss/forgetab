import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"

export type NoteCollectionRef = { current: SyncedNote[] }
export type CommitNotes = (notes: SyncedNote[]) => void
