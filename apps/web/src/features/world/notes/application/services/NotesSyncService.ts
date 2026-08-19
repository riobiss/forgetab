import type {
  LegacyNotesSource,
  NotesCacheRepository,
  NotesCacheScope
} from "@/features/world/notes/application/contracts/NotesCacheRepository"
import type {
  NotePayload,
  NotesGateway,
  NotesPage,
  NotesPageOptions
} from "@/features/world/notes/application/contracts/NotesGateway"
import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"
import type { Note } from "@/features/world/notes/domain/Note"

export interface NotesSyncService {
  loadCached(scope: NotesCacheScope): SyncedNote[]
  loadLegacy(scope: NotesCacheScope): SyncedNote[]
  cache(scope: NotesCacheScope, notes: SyncedNote[]): void
  list(rpgId: string, options: NotesPageOptions): Promise<NotesPage>
  create(rpgId: string, payload: NotePayload): Promise<Note>
  update(rpgId: string, noteId: string, payload: NotePayload): Promise<Note>
  delete(rpgId: string, noteId: string): Promise<void>
}

type Dependencies = {
  gateway: NotesGateway
  cache: NotesCacheRepository
  legacySource: LegacyNotesSource
}

export function createNotesSyncService({
  gateway,
  cache,
  legacySource
}: Dependencies): NotesSyncService {
  return {
    loadCached: (scope) => cache.load(scope),
    loadLegacy: (scope) => legacySource.load(scope),
    cache: (scope, notes) => cache.save(scope, notes),
    list: (rpgId, options) => gateway.list(rpgId, options),
    create: (rpgId, payload) => gateway.create(rpgId, payload),
    update: (rpgId, noteId, payload) => gateway.update(rpgId, noteId, payload),
    delete: (rpgId, noteId) => gateway.delete(rpgId, noteId)
  }
}
