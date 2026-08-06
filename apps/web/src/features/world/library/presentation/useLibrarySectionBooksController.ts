"use client"

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import type { LibraryDependencies } from "@/features/world/library/application/contracts/LibraryDependencies"
import {
  createLibraryBookUseCase,
  deleteLibraryBookUseCase,
  loadLibrarySectionBooksUseCase,
  updateLibraryBookUseCase
} from "@/features/world/library/application/use-cases/library"
import type {
  LibraryBookDto,
  LibrarySectionDto
} from "@/features/world/library/application/types"
import { dismissToast } from "@/lib/toast"

export type LibraryBookVisibility = "private" | "public" | "unlisted"

type Params = {
  rpgId: string
  sectionId: string
  deps: LibraryDependencies
}

export function useLibrarySectionBooksController({
  rpgId,
  sectionId,
  deps
}: Params) {
  const router = useRouter()
  const [section, setSection] = useState<LibrarySectionDto | null>(null)
  const [books, setBooks] = useState<LibraryBookDto[]>([])
  const [canCreate, setCanCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createVisibility, setCreateVisibility] =
    useState<LibraryBookVisibility>("private")
  const [createError, setCreateError] = useState("")
  const [savingCreate, setSavingCreate] = useState(false)
  const [editingBook, setEditingBook] = useState<LibraryBookDto | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editVisibility, setEditVisibility] =
    useState<LibraryBookVisibility>("private")
  const [editAllowedUserIds, setEditAllowedUserIds] = useState<string[]>([])
  const [editAllowedRaceKeys, setEditAllowedRaceKeys] = useState<string[]>([])
  const [editAllowedClassKeys, setEditAllowedClassKeys] = useState<string[]>([])
  const [playerOptions, setPlayerOptions] = useState<ReactSelectOption[]>([])
  const [raceOptions, setRaceOptions] = useState<ReactSelectOption[]>([])
  const [classOptions, setClassOptions] = useState<ReactSelectOption[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState("")
  const deferredSearch = useDeferredValue(search)

  const filteredBooks = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase()
    if (!normalized) return books
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(normalized) ||
        (book.description ?? "").toLowerCase().includes(normalized)
    )
  }, [books, deferredSearch])
  const selectedPlayerOptions = useMemo(
    () =>
      playerOptions.filter((item) => editAllowedUserIds.includes(item.value)),
    [editAllowedUserIds, playerOptions]
  )
  const selectedRaceOptions = useMemo(
    () =>
      raceOptions.filter((item) => editAllowedRaceKeys.includes(item.value)),
    [editAllowedRaceKeys, raceOptions]
  )
  const selectedClassOptions = useMemo(
    () =>
      classOptions.filter((item) => editAllowedClassKeys.includes(item.value)),
    [classOptions, editAllowedClassKeys]
  )

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")
      const payload = await loadLibrarySectionBooksUseCase(deps, {
        rpgId,
        sectionId
      })
      setSection(payload.section)
      setBooks(payload.books)
      setCanCreate(payload.canCreate)
      setPlayerOptions(
        payload.players.map((item) => ({
          value: item.id,
          label: item.name
            ? `@${item.username} - ${item.name}`
            : `@${item.username}`
        }))
      )
      setRaceOptions(
        payload.races.map((item) => ({ value: item.key, label: item.label }))
      )
      setClassOptions(
        payload.classes.map((item) => ({ value: item.key, label: item.label }))
      )
    } catch (cause) {
      setLoadingError(
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao carregar biblioteca."
      )
    } finally {
      setLoading(false)
    }
  }, [deps, rpgId, sectionId])

  useEffect(() => {
    if (rpgId && sectionId) void loadData()
  }, [loadData, rpgId, sectionId])

  function openBook(bookId: string) {
    router.push(`/rpg/${rpgId}/library/${sectionId}/books/${bookId}`)
  }

  async function deleteBook(bookId: string) {
    if (!window.confirm("Tem certeza que deseja apagar este livro?")) return
    const loadingToastId = toast.loading("Apagando livro...")
    try {
      setDeletingId(bookId)
      await deleteLibraryBookUseCase(deps, { rpgId, bookId })
      setBooks((current) => current.filter((book) => book.id !== bookId))
      toast.success("Livro apagado com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao apagar livro."
      setLoadingError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setDeletingId(null)
    }
  }

  function resetCreateForm() {
    setCreateTitle("")
    setCreateDescription("")
    setCreateVisibility("private")
    setCreateError("")
  }

  function openCreateModal() {
    resetCreateForm()
    setIsCreateModalOpen(true)
  }

  function closeCreateModal(force = false) {
    if (!force && savingCreate) return
    setIsCreateModalOpen(false)
    resetCreateForm()
  }

  async function createBook() {
    const normalizedTitle = createTitle.trim()
    const normalizedDescription = createDescription.trim()
    if (normalizedTitle.length < 2) {
      setCreateError("Informe um nome com pelo menos 2 caracteres.")
      return
    }

    setSavingCreate(true)
    setCreateError("")
    const loadingToastId = toast.loading("Criando livro...")
    try {
      const book = await createLibraryBookUseCase(deps, {
        rpgId,
        sectionId,
        payload: {
          title: normalizedTitle,
          description: normalizedDescription || null,
          content: { type: "doc", content: [] },
          visibility: createVisibility,
          allowedCharacterIds: [],
          allowedClassKeys: [],
          allowedRaceKeys: []
        }
      })
      setBooks((current) => [book, ...current])
      closeCreateModal(true)
      router.push(`/rpg/${rpgId}/library/${sectionId}/books/${book.id}/edit`)
      toast.success("Livro criado com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao criar livro."
      setCreateError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setSavingCreate(false)
    }
  }

  function openEditModal(book: LibraryBookDto) {
    setEditingBook(book)
    setEditTitle(book.title)
    setEditDescription(book.description ?? "")
    setEditVisibility(book.visibility)
    setEditAllowedUserIds(book.allowedCharacterIds ?? [])
    setEditAllowedRaceKeys(book.allowedRaceKeys ?? [])
    setEditAllowedClassKeys(book.allowedClassKeys ?? [])
    setEditError("")
  }

  function closeEditModal(force = false) {
    if (!force && savingEdit) return
    setEditingBook(null)
    setEditTitle("")
    setEditDescription("")
    setEditVisibility("private")
    setEditAllowedUserIds([])
    setEditAllowedRaceKeys([])
    setEditAllowedClassKeys([])
    setEditError("")
  }

  async function saveBook() {
    if (!editingBook || savingEdit) return
    setSavingEdit(true)
    setEditError("")
    const loadingToastId = toast.loading("Salvando livro...")
    try {
      const book = await updateLibraryBookUseCase(deps, {
        rpgId,
        bookId: editingBook.id,
        payload: {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          content: editingBook.content,
          visibility: editVisibility,
          allowedCharacterIds:
            editVisibility === "private" ? editAllowedUserIds : [],
          allowedClassKeys:
            editVisibility === "private" ? editAllowedClassKeys : [],
          allowedRaceKeys:
            editVisibility === "private" ? editAllowedRaceKeys : []
        }
      })
      setBooks((current) =>
        current.map((item) => (item.id === book.id ? book : item))
      )
      closeEditModal(true)
      toast.success("Livro atualizado com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao salvar configuracoes do livro."
      setEditError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setSavingEdit(false)
    }
  }

  return {
    section,
    canCreate,
    loading,
    loadingError,
    deletingId,
    search,
    filteredBooks,
    setSearch,
    openBook,
    deleteBook,
    openCreateModal,
    openEditModal,
    createModal: {
      isOpen: isCreateModalOpen,
      title: createTitle,
      description: createDescription,
      visibility: createVisibility,
      error: createError,
      saving: savingCreate,
      setTitle: setCreateTitle,
      setDescription: setCreateDescription,
      setVisibility: setCreateVisibility,
      onCreate: createBook,
      onClose: closeCreateModal
    },
    editModal: {
      isOpen: editingBook !== null,
      title: editTitle,
      description: editDescription,
      visibility: editVisibility,
      error: editError,
      saving: savingEdit,
      playerOptions,
      raceOptions,
      classOptions,
      selectedPlayerOptions,
      selectedRaceOptions,
      selectedClassOptions,
      setTitle: setEditTitle,
      setDescription: setEditDescription,
      setVisibility: setEditVisibility,
      setAllowedUserIds: setEditAllowedUserIds,
      setAllowedRaceKeys: setEditAllowedRaceKeys,
      setAllowedClassKeys: setEditAllowedClassKeys,
      onSave: saveBook,
      onClose: closeEditModal
    }
  }
}

export type LibraryBookCreateModalModel = ReturnType<
  typeof useLibrarySectionBooksController
>["createModal"]

export type LibraryBookEditModalModel = ReturnType<
  typeof useLibrarySectionBooksController
>["editModal"]
