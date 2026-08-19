import { serverNoteToLocal } from "@/features/world/notes/application/noteSync"
import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"
import type { Note } from "@/features/world/notes/domain/Note"
import { NOTES_DEFAULT_PAGE_SIZE } from "@forgetab/world-contracts/notes"

export const AUTOSAVE_DEBOUNCE_MS = 700
export const AUTOSAVE_SAFETY_INTERVAL_MS = 5_000
export const NOTES_PAGE_SIZE = NOTES_DEFAULT_PAGE_SIZE

export function isPendingNote(note: SyncedNote) {
  return ["pending", "offline", "error"].includes(note.syncStatus)
}

export function hasNoteContent(note: SyncedNote) {
  return Boolean(note.title.trim() || note.content.trim())
}

export function noteIdentity(note: Pick<Note, "id" | "clientId">) {
  return note.clientId ?? note.id
}

export function mergeInitialNotes(
  serverNotes: Note[],
  cachedNotes: SyncedNote[],
  legacyNotes: SyncedNote[],
  includeSavedCached = false
) {
  const cachedByIdentity = new Map<string, SyncedNote>()
  for (const note of cachedNotes) {
    cachedByIdentity.set(noteIdentity(note), note)
  }

  const merged = serverNotes.map((serverNote) => {
    const identity = noteIdentity(serverNote)
    const cached = cachedByIdentity.get(identity)
    cachedByIdentity.delete(identity)
    if (!cached || !isPendingNote(cached)) return serverNoteToLocal(serverNote)
    return {
      ...cached,
      id: serverNote.id,
      clientId: serverNote.clientId,
      revision: serverNote.revision,
      createdAt: serverNote.createdAt,
      isNew: false
    }
  })

  for (const cached of cachedByIdentity.values()) {
    if (includeSavedCached || cached.isNew || isPendingNote(cached)) {
      merged.push(cached)
    }
  }

  const knownClientIds = new Set(merged.map((note) => note.clientId))
  for (const legacy of legacyNotes) {
    if (!knownClientIds.has(legacy.clientId)) merged.push(legacy)
  }

  return sortNotesByLastUpdate(merged)
}

export function mergePageNotes(
  serverNotes: Note[],
  currentNotes: SyncedNote[]
) {
  const notesByIdentity = new Map(
    currentNotes.map((note) => [noteIdentity(note), note] as const)
  )

  for (const serverNote of serverNotes) {
    const identity = noteIdentity(serverNote)
    const current = notesByIdentity.get(identity)
    if (current && isPendingNote(current)) {
      notesByIdentity.set(identity, {
        ...current,
        id: serverNote.id,
        clientId: serverNote.clientId,
        revision: serverNote.revision,
        createdAt: serverNote.createdAt,
        isNew: false
      })
      continue
    }
    notesByIdentity.set(identity, serverNoteToLocal(serverNote))
  }

  return sortNotesByLastUpdate([...notesByIdentity.values()])
}

export function sortNotesByLastUpdate(notes: SyncedNote[]) {
  return [...notes].sort(
    (first, second) =>
      Date.parse(second.updatedAt) - Date.parse(first.updatedAt)
  )
}

export function paginationKey(labelId: string | null) {
  return labelId ?? "__all__"
}

export function isRetryableSyncFailure(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) return true
  const status = (error as { status?: unknown }).status
  if (typeof status !== "number") return true
  return status === 408 || status === 425 || status === 429 || status >= 500
}
