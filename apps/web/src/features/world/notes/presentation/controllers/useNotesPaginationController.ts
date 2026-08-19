"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { NotesCacheScope } from "@/features/world/notes/application/contracts/NotesCacheRepository"
import type { NotesSyncService } from "@/features/world/notes/application/services/NotesSyncService"
import {
  isPendingNote,
  mergeInitialNotes,
  mergePageNotes,
  NOTES_PAGE_SIZE,
  paginationKey,
  sortNotesByLastUpdate
} from "@/features/world/notes/application/services/noteSyncPolicy"
import type { CommitNotes, NoteCollectionRef } from "./noteCollection"

type PaginationEntry = {
  initialized: boolean
  nextCursor: string | null
  error: string | null
}

type Options = NotesCacheScope & {
  service: NotesSyncService
  notesRef: NoteCollectionRef
  commit: CommitNotes
  scheduleRetry: (localKey: string, delay: number) => void
}

export function useNotesPaginationController({
  rpgId,
  userId,
  service,
  notesRef,
  commit,
  scheduleRetry
}: Options) {
  const scope = { rpgId, userId }
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const pageRequestsRef = useRef(new Set<string>())
  const paginationRef = useRef(new Map<string, PaginationEntry>())
  const activeLabelFilterRef = useRef<string | null>(null)

  const fetchPage = useCallback(
    async (labelId: string | null, cursor: string | null) => {
      const key = paginationKey(labelId)
      const requestKey = `${key}:${cursor ?? "first"}`
      if (pageRequestsRef.current.has(requestKey)) return

      pageRequestsRef.current.add(requestKey)
      const isFirstPage = cursor === null
      if (activeLabelFilterRef.current === labelId) {
        if (isFirstPage) setIsLoading(true)
        else setIsLoadingMore(true)
        setLoadError(null)
      }

      try {
        const page = await service.list(rpgId, {
          cursor,
          limit: NOTES_PAGE_SIZE,
          labelId
        })
        commit(mergePageNotes(page.notes, notesRef.current))
        paginationRef.current.set(key, {
          initialized: true,
          nextCursor: page.nextCursor,
          error: null
        })
        if (activeLabelFilterRef.current === labelId) {
          setHasMore(page.nextCursor !== null)
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as notas."
        const previous = paginationRef.current.get(key)
        paginationRef.current.set(key, {
          initialized: previous?.initialized ?? false,
          nextCursor: previous?.nextCursor ?? cursor,
          error: message
        })
        if (activeLabelFilterRef.current === labelId) setLoadError(message)
      } finally {
        pageRequestsRef.current.delete(requestKey)
        if (activeLabelFilterRef.current === labelId) {
          if (isFirstPage) setIsLoading(false)
          else setIsLoadingMore(false)
        }
      }
    },
    [commit, notesRef, rpgId, service]
  )

  const setListFilter = useCallback(
    (labelId: string | null) => {
      if (activeLabelFilterRef.current === labelId) return
      activeLabelFilterRef.current = labelId
      const entry = paginationRef.current.get(paginationKey(labelId))
      setLoadError(entry?.error ?? null)
      setHasMore(!entry?.initialized || entry.nextCursor !== null)
      setIsLoadingMore(false)
      if (!entry?.initialized) void fetchPage(labelId, null)
      else setIsLoading(false)
    },
    [fetchPage]
  )

  const loadMore = useCallback(() => {
    const labelId = activeLabelFilterRef.current
    const entry = paginationRef.current.get(paginationKey(labelId))
    if (!entry?.initialized) {
      void fetchPage(labelId, null)
      return
    }
    if (entry.nextCursor) void fetchPage(labelId, entry.nextCursor)
  }, [fetchPage])

  useEffect(() => {
    activeLabelFilterRef.current = null
    paginationRef.current.clear()
    pageRequestsRef.current.clear()
    const cached = service.loadCached(scope)
    const legacy = service.loadLegacy(scope)
    if (cached.length || legacy.length) {
      const recentCached = sortNotesByLastUpdate(cached).slice(
        0,
        NOTES_PAGE_SIZE
      )
      commit(mergeInitialNotes([], recentCached, legacy, true))
    }

    const initialRequestKey = `${paginationKey(null)}:first`
    pageRequestsRef.current.add(initialRequestKey)
    service
      .list(rpgId, { limit: NOTES_PAGE_SIZE, labelId: null })
      .then((page) => {
        const merged =
          activeLabelFilterRef.current === null
            ? mergeInitialNotes(page.notes, notesRef.current, legacy)
            : mergePageNotes(page.notes, notesRef.current)
        commit(merged)
        paginationRef.current.set(paginationKey(null), {
          initialized: true,
          nextCursor: page.nextCursor,
          error: null
        })
        if (activeLabelFilterRef.current === null) {
          setHasMore(page.nextCursor !== null)
          setLoadError(null)
        }
        for (const note of merged) {
          if (isPendingNote(note)) scheduleRetry(note.localKey, 0)
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as notas."
        paginationRef.current.set(paginationKey(null), {
          initialized: false,
          nextCursor: null,
          error: message
        })
        if (activeLabelFilterRef.current === null) setLoadError(message)
      })
      .finally(() => {
        pageRequestsRef.current.delete(initialRequestKey)
        if (activeLabelFilterRef.current === null) setIsLoading(false)
      })
  }, [commit, notesRef, rpgId, scheduleRetry, service, userId])

  return {
    isLoading,
    isLoadingMore,
    hasMore,
    loadError,
    setListFilter,
    loadMore
  }
}
