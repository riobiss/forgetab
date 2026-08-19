import type {
  NoteSyncStatus,
  SyncedNote
} from "@/features/world/notes/application/models/SyncedNote"
import type { NoteLabel } from "@/features/world/notes/domain/Note"
import type {
  NotesCacheRepository,
  NotesCacheScope
} from "@/features/world/notes/application/contracts/NotesCacheRepository"

export const NOTES_CACHE_PREFIX = "forgetab:notes-cache:v1:"

function cacheKey(scope: NotesCacheScope) {
  return `${NOTES_CACHE_PREFIX}${scope.rpgId}:${scope.userId}`
}

function parseLabels(value: unknown): NoteLabel[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const label = item as Record<string, unknown>
    return typeof label.id === "string" && typeof label.name === "string"
      ? [{ id: label.id, name: label.name }]
      : []
  })
}

function parseStatus(value: unknown): NoteSyncStatus {
  return ["pending", "saving", "saved", "offline", "error"].includes(
    String(value)
  )
    ? (value as NoteSyncStatus)
    : "saved"
}

function parseCachedNote(value: unknown): SyncedNote | null {
  if (!value || typeof value !== "object") return null
  const note = value as Record<string, unknown>
  if (
    typeof note.id !== "string" ||
    typeof note.title !== "string" ||
    typeof note.content !== "string" ||
    typeof note.createdAt !== "string" ||
    typeof note.updatedAt !== "string"
  ) {
    return null
  }
  const clientId = typeof note.clientId === "string" ? note.clientId : null
  return {
    id: note.id,
    clientId,
    localKey:
      typeof note.localKey === "string"
        ? note.localKey
        : clientId
          ? `client:${clientId}`
          : `server:${note.id}`,
    title: note.title,
    content: note.content,
    labels: parseLabels(note.labels),
    revision:
      typeof note.revision === "number" && note.revision >= 0
        ? note.revision
        : 0,
    localVersion:
      typeof note.localVersion === "number" && note.localVersion >= 0
        ? note.localVersion
        : 0,
    isNew: Boolean(note.isNew),
    syncStatus:
      parseStatus(note.syncStatus) === "saving"
        ? "pending"
        : parseStatus(note.syncStatus),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  }
}

export const notesCacheRepository: NotesCacheRepository = {
  load(scope: NotesCacheScope): SyncedNote[] {
    try {
      const raw = window.localStorage.getItem(cacheKey(scope))
      if (!raw) return []
      const value: unknown = JSON.parse(raw)
      if (!Array.isArray(value)) return []
      return value.flatMap((note) => parseCachedNote(note) ?? [])
    } catch {
      return []
    }
  },

  save(scope: NotesCacheScope, notes: SyncedNote[]) {
    try {
      window.localStorage.setItem(cacheKey(scope), JSON.stringify(notes))
    } catch {
      // O estado em memoria continua sendo a fonte local quando o storage falha.
    }
  }
}
