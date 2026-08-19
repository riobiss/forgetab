import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"

export type NotesCacheScope = { rpgId: string; userId: string }

export interface NotesCacheRepository {
  load(scope: NotesCacheScope): SyncedNote[]
  save(scope: NotesCacheScope, notes: SyncedNote[]): void
}

export interface LegacyNotesSource {
  load(scope: NotesCacheScope): SyncedNote[]
}
