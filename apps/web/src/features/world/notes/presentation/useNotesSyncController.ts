"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { NotesCacheScope } from "@/features/world/notes/application/contracts/NotesCacheRepository"
import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"
import type { NotesSyncService } from "@/features/world/notes/application/services/NotesSyncService"
import { AUTOSAVE_DEBOUNCE_MS } from "@/features/world/notes/application/services/noteSyncPolicy"
import type { Note, NoteLabel } from "@/features/world/notes/domain/Note"
import { useNoteAutosaveController } from "./controllers/useNoteAutosaveController"
import { useNotesPaginationController } from "./controllers/useNotesPaginationController"

export {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_SAFETY_INTERVAL_MS,
  NOTES_PAGE_SIZE
} from "@/features/world/notes/application/services/noteSyncPolicy"

type Options = NotesCacheScope & {
  service: NotesSyncService
}

type EditablePatch = Partial<Pick<Note, "title" | "content" | "labels">>

export function useNotesSyncController({ rpgId, userId, service }: Options) {
  const scope = useMemo(() => ({ rpgId, userId }), [rpgId, userId])
  const [notes, setNotes] = useState<SyncedNote[]>([])
  const notesRef = useRef<SyncedNote[]>([])
  const mountedRef = useRef(true)

  const commit = useCallback(
    (nextNotes: SyncedNote[]) => {
      notesRef.current = nextNotes
      if (mountedRef.current) setNotes(nextNotes)
      service.cache(scope, nextNotes)
    },
    [scope, service]
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [rpgId, userId])

  const { scheduleRetry, cancelScheduledSync, flush, flushAll } =
    useNoteAutosaveController({
      rpgId,
      service,
      notesRef,
      commit
    })
  const pagination = useNotesPaginationController({
    rpgId,
    userId,
    service,
    notesRef,
    commit,
    scheduleRetry
  })

  const createDraft = useCallback(
    (initial?: { title?: string; content?: string; labels?: NoteLabel[] }) => {
      const clientId = crypto.randomUUID()
      const now = new Date().toISOString()
      const hasInitialContent = Boolean(initial?.title || initial?.content)
      const note: SyncedNote = {
        id: `local:${clientId}`,
        clientId,
        localKey: `client:${clientId}`,
        title: initial?.title ?? "",
        content: initial?.content ?? "",
        labels: initial?.labels ?? [],
        revision: 0,
        localVersion: hasInitialContent ? 1 : 0,
        isNew: true,
        syncStatus: hasInitialContent ? "pending" : "saved",
        createdAt: now,
        updatedAt: now
      }
      commit([note, ...notesRef.current])
      if (hasInitialContent) {
        scheduleRetry(note.localKey, AUTOSAVE_DEBOUNCE_MS)
      }
      return note.localKey
    },
    [commit, scheduleRetry]
  )

  const updateLocal = useCallback(
    (localKey: string, patch: EditablePatch) => {
      const nextNotes = notesRef.current.map((note) =>
        note.localKey === localKey
          ? {
              ...note,
              ...patch,
              localVersion: note.localVersion + 1,
              syncStatus: "pending" as const,
              updatedAt: new Date().toISOString()
            }
          : note
      )
      commit(nextNotes)
      scheduleRetry(localKey, AUTOSAVE_DEBOUNCE_MS)
    },
    [commit, scheduleRetry]
  )

  const remove = useCallback(
    async (localKey: string) => {
      const note = notesRef.current.find((item) => item.localKey === localKey)
      if (!note) return
      cancelScheduledSync(localKey)
      commit(notesRef.current.filter((item) => item.localKey !== localKey))
      if (note.isNew) return
      try {
        await service.delete(rpgId, note.id)
      } catch (error) {
        commit([{ ...note, syncStatus: "error" }, ...notesRef.current])
        throw error
      }
    },
    [cancelScheduledSync, commit, rpgId, service]
  )

  const replaceLabelMetadata = useCallback(
    (label: NoteLabel) => {
      commit(
        notesRef.current.map((note) => ({
          ...note,
          labels: note.labels.map((current) =>
            current.id === label.id ? label : current
          )
        }))
      )
    },
    [commit]
  )

  const removeLabelMetadata = useCallback(
    (labelId: string) => {
      commit(
        notesRef.current.map((note) => ({
          ...note,
          labels: note.labels.filter((label) => label.id !== labelId)
        }))
      )
    },
    [commit]
  )

  return {
    notes,
    ...pagination,
    createDraft,
    updateLocal,
    remove,
    replaceLabelMetadata,
    removeLabelMetadata,
    flush,
    flushAll
  }
}
