"use client"

import type { FormEvent } from "react"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { toast } from "react-hot-toast"
import type { LibraryDependencies } from "@/features/world/library/application/contracts/LibraryDependencies"
import {
  createLibrarySectionUseCase,
  deleteLibrarySectionUseCase,
  loadLibrarySectionsUseCase,
  updateLibrarySectionUseCase
} from "@/features/world/library/application/use-cases/library"
import type { LibrarySectionDto } from "@/features/world/library/application/types"
import { dismissToast } from "@/shared/presentation/notifications/toast"
import { matchesSearch } from "@forgetab/world-contracts/shared/search"

export function useLibrarySectionsController(params: {
  rpgId: string
  deps: LibraryDependencies
}) {
  const [sections, setSections] = useState<LibrarySectionDto[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("public")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const favoriteStorageKey = `library:sections:favorites:${params.rpgId}`

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])
  const filteredSections = useMemo(() => {
    const source = favoritesOnly
      ? sections.filter((section) => favoriteIdSet.has(section.id))
      : sections
    return source.filter((section) =>
      matchesSearch([section.title, section.description], deferredSearch)
    )
  }, [deferredSearch, favoriteIdSet, favoritesOnly, sections])

  const loadSections = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")
      const payload = await loadLibrarySectionsUseCase(params.deps, {
        rpgId: params.rpgId
      })
      setSections(payload.sections)
    } catch (cause) {
      setLoadingError(
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao carregar secoes da biblioteca."
      )
      setSections([])
    } finally {
      setLoading(false)
    }
  }, [params.deps, params.rpgId])

  useEffect(() => {
    if (params.rpgId) void loadSections()
  }, [loadSections, params.rpgId])

  useEffect(() => {
    if (typeof window === "undefined") return
    setFavoritesLoaded(false)
    const rawFavorites = window.localStorage.getItem(favoriteStorageKey)
    if (!rawFavorites) {
      setFavoriteIds([])
      setFavoritesLoaded(true)
      return
    }

    try {
      const parsedFavorites = JSON.parse(rawFavorites)
      setFavoriteIds(
        Array.isArray(parsedFavorites) ? parsedFavorites.filter(Boolean) : []
      )
    } catch {
      setFavoriteIds([])
    } finally {
      setFavoritesLoaded(true)
    }
  }, [favoriteStorageKey])

  useEffect(() => {
    if (typeof window === "undefined" || !favoritesLoaded) return
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteIds))
  }, [favoriteIds, favoriteStorageKey, favoritesLoaded])

  function resetForm() {
    setEditingId(null)
    setTitle("")
    setDescription("")
    setVisibility("public")
    setSubmitError("")
  }

  function closeModal() {
    setIsModalOpen(false)
    resetForm()
  }

  function startEdit(section: LibrarySectionDto) {
    setEditingId(section.id)
    setTitle(section.title)
    setDescription(section.description ?? "")
    setVisibility(section.visibility)
    setSubmitError("")
    setIsModalOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSubmitError("")
    const loadingToastId = toast.loading(
      editingId ? "Salvando secao..." : "Criando secao..."
    )

    try {
      const payload = {
        title,
        description: description.trim() || null,
        visibility
      }
      const section = editingId
        ? await updateLibrarySectionUseCase(params.deps, {
            rpgId: params.rpgId,
            sectionId: editingId,
            payload
          })
        : await createLibrarySectionUseCase(params.deps, {
            rpgId: params.rpgId,
            payload
          })

      setSections((current) =>
        editingId
          ? current.map((item) => (item.id === section.id ? section : item))
          : [section, ...current]
      )
      toast.success(
        editingId
          ? "Secao atualizada com sucesso."
          : "Secao criada com sucesso."
      )
      closeModal()
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao salvar secao."
      setSubmitError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setSaving(false)
      savingRef.current = false
    }
  }

  async function deleteSection(sectionId: string) {
    if (
      !window.confirm(
        "Tem certeza que deseja apagar esta sessao e seus livros?"
      )
    ) {
      return
    }
    const loadingToastId = toast.loading("Apagando secao...")
    try {
      setDeletingId(sectionId)
      await deleteLibrarySectionUseCase(params.deps, {
        rpgId: params.rpgId,
        sectionId
      })
      setSections((current) => current.filter((item) => item.id !== sectionId))
      if (editingId === sectionId) resetForm()
      toast.success("Secao apagada com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao remover secao."
      setLoadingError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setDeletingId(null)
    }
  }

  return {
    sections,
    filteredSections,
    favoriteIdSet,
    favoritesOnly,
    setFavoritesOnly,
    loading,
    loadingError,
    deletingId,
    search,
    setSearch,
    openCreateModal: () => setIsModalOpen(true),
    startEdit,
    deleteSection,
    toggleFavorite(sectionId: string) {
      setFavoriteIds((current) =>
        current.includes(sectionId)
          ? current.filter((id) => id !== sectionId)
          : [...current, sectionId]
      )
    },
    modal: {
      isOpen: isModalOpen,
      editingId,
      title,
      setTitle,
      description,
      setDescription,
      visibility,
      setVisibility,
      submitError,
      saving,
      close: closeModal,
      submit
    }
  }
}

export type LibrarySectionsModalModel = ReturnType<
  typeof useLibrarySectionsController
>["modal"]
