"use client"

import { useCallback, useEffect, useRef } from "react"
import type { NotesSyncService } from "@/features/world/notes/application/services/NotesSyncService"
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_SAFETY_INTERVAL_MS,
  hasNoteContent,
  isPendingNote,
  isRetryableSyncFailure,
  sortNotesByLastUpdate
} from "@/features/world/notes/application/services/noteSyncPolicy"
import { serverNoteToLocal } from "@/features/world/notes/application/noteSync"
import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"
import type { CommitNotes, NoteCollectionRef } from "./noteCollection"

type Options = {
  rpgId: string
  service: NotesSyncService
  notesRef: NoteCollectionRef
  commit: CommitNotes
}

export function useNoteAutosaveController({
  rpgId,
  service,
  notesRef,
  commit
}: Options) {
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const inFlightRef = useRef(new Set<string>())
  const permanentFailuresRef = useRef(new Set<string>())
  const syncOneRef = useRef<(localKey: string) => Promise<void>>(async () => {})

  const scheduleRetry = useCallback((localKey: string, delay: number) => {
    permanentFailuresRef.current.delete(localKey)
    const currentTimer = timersRef.current.get(localKey)
    if (currentTimer) clearTimeout(currentTimer)
    const timer = setTimeout(() => {
      timersRef.current.delete(localKey)
      void syncOneRef.current(localKey)
    }, delay)
    timersRef.current.set(localKey, timer)
  }, [])

  const cancelScheduledSync = useCallback((localKey: string) => {
    const timer = timersRef.current.get(localKey)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(localKey)
    permanentFailuresRef.current.delete(localKey)
  }, [])

  const syncOne = useCallback(
    async (localKey: string) => {
      const snapshot = notesRef.current.find(
        (note) => note.localKey === localKey
      )
      if (!snapshot || !isPendingNote(snapshot) || !hasNoteContent(snapshot)) {
        return
      }
      if (inFlightRef.current.has(localKey)) return
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        commit(
          notesRef.current.map((note) =>
            note.localKey === localKey
              ? { ...note, syncStatus: "offline" }
              : note
          )
        )
        return
      }

      inFlightRef.current.add(localKey)
      commit(
        notesRef.current.map((note) =>
          note.localKey === localKey ? { ...note, syncStatus: "saving" } : note
        )
      )

      try {
        const payload = {
          title: snapshot.title.trim(),
          content: snapshot.content,
          labelIds: snapshot.labels.map((label) => label.id),
          clientId: snapshot.clientId,
          baseRevision: snapshot.isNew ? null : snapshot.revision
        }
        const persisted = snapshot.isNew
          ? await service.create(rpgId, payload)
          : await service.update(rpgId, snapshot.id, payload)

        const current = notesRef.current.find(
          (note) => note.localKey === localKey
        )
        if (!current) return
        const persistedLabelIds = persisted.labels
          .map((label) => label.id)
          .sort()
          .join("|")
        const sentLabelIds = [...payload.labelIds].sort().join("|")
        const persistedMatchesSnapshot =
          persisted.title === payload.title &&
          persisted.content === payload.content &&
          persistedLabelIds === sentLabelIds
        const hasNewerChanges =
          current.localVersion !== snapshot.localVersion ||
          !persistedMatchesSnapshot
        const next: SyncedNote = hasNewerChanges
          ? {
              ...current,
              id: persisted.id,
              clientId: persisted.clientId,
              revision: persisted.revision,
              createdAt: persisted.createdAt,
              isNew: false,
              syncStatus: "pending"
            }
          : {
              ...serverNoteToLocal(persisted),
              localKey,
              localVersion: current.localVersion
            }
        commit(
          sortNotesByLastUpdate(
            notesRef.current.map((note) =>
              note.localKey === localKey ? next : note
            )
          )
        )
        if (hasNewerChanges) scheduleRetry(localKey, AUTOSAVE_DEBOUNCE_MS)
      } catch (error) {
        const offline = typeof navigator !== "undefined" && !navigator.onLine
        commit(
          notesRef.current.map((note) =>
            note.localKey === localKey
              ? { ...note, syncStatus: offline ? "offline" : "error" }
              : note
          )
        )
        if (offline || isRetryableSyncFailure(error)) {
          scheduleRetry(localKey, AUTOSAVE_SAFETY_INTERVAL_MS)
        } else {
          permanentFailuresRef.current.add(localKey)
        }
      } finally {
        inFlightRef.current.delete(localKey)
      }
    },
    [commit, notesRef, rpgId, scheduleRetry, service]
  )

  useEffect(() => {
    syncOneRef.current = syncOne
  }, [syncOne])

  const flush = useCallback((localKey?: string | null) => {
    if (!localKey || permanentFailuresRef.current.has(localKey)) return
    const timer = timersRef.current.get(localKey)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(localKey)
    void syncOneRef.current(localKey)
  }, [])

  const flushAll = useCallback(() => {
    for (const note of notesRef.current) {
      if (
        isPendingNote(note) &&
        !permanentFailuresRef.current.has(note.localKey)
      ) {
        flush(note.localKey)
      }
    }
  }, [flush, notesRef])

  useEffect(() => {
    const safetyTimer = window.setInterval(
      flushAll,
      AUTOSAVE_SAFETY_INTERVAL_MS
    )
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flushAll()
    }
    window.addEventListener("online", flushAll)
    window.addEventListener("blur", flushAll)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      clearInterval(safetyTimer)
      window.removeEventListener("online", flushAll)
      window.removeEventListener("blur", flushAll)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [flushAll])

  useEffect(() => {
    const timers = timersRef.current
    const permanentFailures = permanentFailuresRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      permanentFailures.clear()
    }
  }, [rpgId, service])

  return { scheduleRetry, cancelScheduledSync, flush, flushAll }
}
