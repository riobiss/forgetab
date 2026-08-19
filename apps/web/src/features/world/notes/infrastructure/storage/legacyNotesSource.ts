import type {
  LegacyNotesSource,
  NotesCacheScope
} from "@/features/world/notes/application/contracts/NotesCacheRepository"

export const LEGACY_NOTES_PREFIX = "forgetab:local-notes:"

function legacyKey(scope: NotesCacheScope) {
  return `${LEGACY_NOTES_PREFIX}${scope.rpgId}:${scope.userId}`
}

export const legacyNotesSource: LegacyNotesSource = {
  load(scope) {
    try {
      const raw = window.localStorage.getItem(legacyKey(scope))
      if (!raw) return []
      const value: unknown = JSON.parse(raw)
      if (!Array.isArray(value)) return []

      return value.flatMap((item) => {
        if (!item || typeof item !== "object") return []
        const note = item as Record<string, unknown>
        if (
          typeof note.id !== "string" ||
          typeof note.content !== "string" ||
          typeof note.createdAt !== "string"
        ) {
          return []
        }
        const createdAt = new Date(note.createdAt)
        if (Number.isNaN(createdAt.getTime())) return []
        const clientId = `legacy:${scope.rpgId}:${scope.userId}:${note.id}`
        const firstLine = note.content
          .split(/\r?\n/)
          .find((line) => line.trim())
          ?.trim()
        return [
          {
            id: `local:${clientId}`,
            clientId,
            localKey: `client:${clientId}`,
            title: firstLine?.slice(0, 120) || "Nota migrada",
            content: note.content,
            labels: [],
            revision: 0,
            localVersion: 1,
            isNew: true,
            syncStatus: "pending" as const,
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString()
          }
        ]
      })
    } catch {
      return []
    }
  }
}
