import type { Note } from "@/features/world/notes/domain/Note"

export type NoteSyncStatus =
  "pending" | "saving" | "saved" | "offline" | "error"

export type SyncedNote = Note & {
  localKey: string
  localVersion: number
  isNew: boolean
  syncStatus: NoteSyncStatus
}
