"use client"

import type { JSONContent } from "@tiptap/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import {
  createLibraryBookUseCase,
  loadLibraryBookUseCase,
  updateLibraryBookUseCase,
} from "@/application/library/use-cases/library"
import { dismissToast } from "@/lib/toast"
import {
  buildLibraryBookDraftStorageKey,
  createDefaultLibraryBookDraft,
  createLibraryBookDraftSnapshot,
  parseLibraryBookDraft,
  serializeLibraryBookDraft,
} from "./libraryBookEditorDraft"
import {
  DEFAULT_LIBRARY_BOOK_TITLE,
  type LibraryBookDraft,
  type LibraryBookMetadata,
} from "./libraryBookEditor.types"

type Params = {
  rpgId: string
  sectionId: string
  mode: "create" | "edit"
  bookId?: string
  forceReadOnly?: boolean
  deps: LibraryDependencies
  onPersist?: (bookId: string) => void
}

export function useLibraryBookEditorState({
  rpgId,
  sectionId,
  mode,
  bookId,
  forceReadOnly = false,
  deps,
  onPersist,
}: Params) {
  const isEdit = mode === "edit"
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [draft, setDraft] = useState<LibraryBookDraft>(createDefaultLibraryBookDraft)
  const [editorKey, setEditorKey] = useState("new")
  const [canEdit, setCanEdit] = useState(!isEdit && !forceReadOnly)
  const [contentEditing, setContentEditing] = useState(!isEdit && !forceReadOnly)
  const [currentBookId, setCurrentBookId] = useState<string | null>(bookId ?? null)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [savedSignature, setSavedSignature] = useState(
    serializeLibraryBookDraft(createDefaultLibraryBookDraft()),
  )
  const persistedMetadataRef = useRef<LibraryBookMetadata>({
    title: DEFAULT_LIBRARY_BOOK_TITLE,
    description: "",
    visibility: "private",
    allowedCharacterIds: [],
    allowedClassKeys: [],
    allowedRaceKeys: [],
  })
  const draftStorageKey = useMemo(
    () => buildLibraryBookDraftStorageKey({ rpgId, sectionId, bookId }),
    [bookId, rpgId, sectionId],
  )
  const lastSavedSignatureRef = useRef(serializeLibraryBookDraft(createDefaultLibraryBookDraft()))
  const ignoreFirstEditorSyncRef = useRef(false)

  function extractPlainText(node: JSONContent | null | undefined): string {
    if (!node || typeof node !== "object") return ""
    const ownText = typeof node.text === "string" ? node.text : ""
    const children = Array.isArray(node.content)
      ? node.content.map((child) => extractPlainText(child as JSONContent)).join("")
      : ""
    return `${ownText}${children}`
  }

  useEffect(() => {
    async function loadBook() {
      setDraftHydrated(false)
      setError("")

      if (!isEdit || !bookId) {
        const defaultSnapshot = createDefaultLibraryBookDraft()
        const defaultSignature = serializeLibraryBookDraft(defaultSnapshot)
        const restoredDraft = !forceReadOnly
          ? parseLibraryBookDraft(window.localStorage.getItem(draftStorageKey))
          : null
        const shouldRestoreDraft =
          Boolean(restoredDraft) &&
          serializeLibraryBookDraft(restoredDraft as LibraryBookDraft) !== defaultSignature
        const nextDraft = shouldRestoreDraft ? (restoredDraft as LibraryBookDraft) : defaultSnapshot

        setDraft(nextDraft)
        setEditorKey(shouldRestoreDraft ? "new-draft" : "new")
        setCurrentBookId(null)
        setCanEdit(!forceReadOnly)
        setContentEditing(!forceReadOnly)
        ignoreFirstEditorSyncRef.current = false
        setLoading(false)
        persistedMetadataRef.current = {
          title: nextDraft.title,
          description: nextDraft.description,
          visibility: nextDraft.visibility,
          allowedCharacterIds: nextDraft.allowedCharacterIds,
          allowedClassKeys: nextDraft.allowedClassKeys,
          allowedRaceKeys: nextDraft.allowedRaceKeys,
        }
        lastSavedSignatureRef.current = defaultSignature
        setSavedSignature(defaultSignature)
        setDraftHydrated(true)
        return
      }

      try {
        setLoading(true)
        const payload = await loadLibraryBookUseCase(deps, { rpgId, bookId })
        const book = payload.book
        const serverDraft = createLibraryBookDraftSnapshot({
          title: book.title,
          description: book.description ?? "",
          visibility: book.visibility,
          allowedCharacterIds: Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [],
          allowedClassKeys: Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [],
          allowedRaceKeys: Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [],
          content: book.content,
        })
        const serverSignature = serializeLibraryBookDraft(serverDraft)
        const restoredDraft = !forceReadOnly
          ? parseLibraryBookDraft(window.localStorage.getItem(draftStorageKey))
          : null
        const shouldRestoreDraft =
          Boolean(restoredDraft) &&
          serializeLibraryBookDraft(restoredDraft as LibraryBookDraft) !== serverSignature
        const nextDraft = shouldRestoreDraft ? (restoredDraft as LibraryBookDraft) : serverDraft

        setDraft(nextDraft)
        setEditorKey(`edit-${book.id}-${shouldRestoreDraft ? "draft" : "saved"}`)
        setCurrentBookId(book.id)
        setCanEdit(payload.canEdit && !forceReadOnly)
        setContentEditing(false)
        ignoreFirstEditorSyncRef.current = false
        persistedMetadataRef.current = {
          title: book.title,
          description: book.description ?? "",
          visibility: book.visibility,
          allowedCharacterIds: Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [],
          allowedClassKeys: Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [],
          allowedRaceKeys: Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [],
        }
        lastSavedSignatureRef.current = serverSignature
        setSavedSignature(serverSignature)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro ao carregar livro.")
      } finally {
        setLoading(false)
        setDraftHydrated(true)
      }
    }

    void loadBook()
  }, [bookId, deps, draftStorageKey, forceReadOnly, isEdit, rpgId])

  useEffect(() => {
    if (loading || !draftHydrated || !canEdit || forceReadOnly) return

    const snapshot = createLibraryBookDraftSnapshot(draft)
    const signature = serializeLibraryBookDraft(snapshot)

    if (signature === lastSavedSignatureRef.current) {
      window.localStorage.removeItem(draftStorageKey)
      return
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(draftStorageKey, signature)
    }, 450)

    return () => window.clearTimeout(timeoutId)
  }, [canEdit, deps, draft, draftHydrated, draftStorageKey, forceReadOnly, loading])

  async function saveBook() {
    if (saving || !canEdit) return
    setSaving(true)
    setError("")
    const loadingToastId = toast.loading(currentBookId ? "Salvando livro..." : "Criando livro...")

    try {
      const metadata = currentBookId ? persistedMetadataRef.current : draft
      const payload = {
        title: metadata.title,
        description: metadata.description.trim() ? metadata.description.trim() : null,
        content: draft.content,
        visibility: metadata.visibility,
        allowedCharacterIds: metadata.allowedCharacterIds,
        allowedClassKeys: metadata.allowedClassKeys,
        allowedRaceKeys: metadata.allowedRaceKeys,
      }
      const book = currentBookId
        ? await updateLibraryBookUseCase(deps, {
            rpgId,
            bookId: currentBookId,
            payload,
          })
        : await createLibraryBookUseCase(deps, {
            rpgId,
            sectionId,
            payload,
          })

      const savedDraft = createLibraryBookDraftSnapshot({
        title: book.title,
        description: book.description ?? "",
        visibility: book.visibility,
        allowedCharacterIds: Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [],
        allowedClassKeys: Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [],
        allowedRaceKeys: Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [],
        content: book.content,
      })

      setDraft(savedDraft)
      setCurrentBookId(book.id)
      persistedMetadataRef.current = {
        title: book.title,
        description: book.description ?? "",
        visibility: book.visibility,
        allowedCharacterIds: Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [],
        allowedClassKeys: Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [],
        allowedRaceKeys: Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [],
      }
      const nextSavedSignature = serializeLibraryBookDraft(savedDraft)
      lastSavedSignatureRef.current = nextSavedSignature
      setSavedSignature(nextSavedSignature)
      window.localStorage.removeItem(draftStorageKey)
      onPersist?.(book.id)
      toast.success(currentBookId ? "Livro salvo com sucesso." : "Livro criado com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro de conexao ao salvar."
      setError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setSaving(false)
    }
  }

  const hasDraft =
    draftHydrated &&
    canEdit &&
    !forceReadOnly &&
    serializeLibraryBookDraft(createLibraryBookDraftSnapshot(draft)) !== savedSignature

  function updateDraftContent(content: JSONContent) {
    if (ignoreFirstEditorSyncRef.current) {
      ignoreFirstEditorSyncRef.current = false
      if (extractPlainText(content) === extractPlainText(draft.content)) {
        return
      }
    }

    setDraft((current) => ({ ...current, content }))
  }

  function toggleContentEditing() {
    setContentEditing((current) => {
      const nextValue = !current
      if (nextValue) {
        ignoreFirstEditorSyncRef.current = true
      }
      return nextValue
    })
  }

  return {
    loading,
    saving,
    error,
    draft,
    editorKey,
    canEdit,
    hasDraft,
    contentEditing,
    pageTitle: loading ? (forceReadOnly ? "Livro" : isEdit ? "Editor de livro" : DEFAULT_LIBRARY_BOOK_TITLE) : draft.title,
    setError,
    setDraft,
    toggleContentEditing,
    updateDraftContent,
    saveBook,
  }
}
