"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Plus, Search } from "lucide-react"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import { ReactMultiSelectField } from "@/components/select/ReactMultiSelectField"
import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import {
  createLibraryBookUseCase,
  deleteLibraryBookUseCase,
  loadLibrarySectionBooksUseCase,
  updateLibraryBookUseCase,
} from "@/application/library/use-cases/library"
import type { LibraryBookDto, LibrarySectionDto } from "@/application/library/types"
import { dismissToast } from "@/lib/toast"
import styles from "./LibrarySectionBooksPage.module.css"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
}

type Props = {
  rpgId: string
  sectionId: string
  deps: LibraryDependencies
}

export default function LibrarySectionBooksPage({ rpgId, sectionId, deps }: Props) {
  const router = useRouter()
  const [section, setSection] = useState<LibrarySectionDto | null>(null)
  const [books, setBooks] = useState<LibraryBookDto[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createVisibility, setCreateVisibility] = useState<"private" | "public" | "unlisted">("private")
  const [createError, setCreateError] = useState("")
  const [savingCreate, setSavingCreate] = useState(false)
  const [editingBook, setEditingBook] = useState<LibraryBookDto | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editVisibility, setEditVisibility] = useState<"private" | "public" | "unlisted">("private")
  const [editAllowedUserIds, setEditAllowedUserIds] = useState<string[]>([])
  const [editAllowedRaceKeys, setEditAllowedRaceKeys] = useState<string[]>([])
  const [editAllowedClassKeys, setEditAllowedClassKeys] = useState<string[]>([])
  const [playerOptions, setPlayerOptions] = useState<ReactSelectOption[]>([])
  const [raceOptions, setRaceOptions] = useState<ReactSelectOption[]>([])
  const [classOptions, setClassOptions] = useState<ReactSelectOption[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState("")
  const [search, setSearch] = useState("")

  const selectedPlayerOptions = useMemo(
    () => playerOptions.filter((item) => editAllowedUserIds.includes(item.value)),
    [playerOptions, editAllowedUserIds],
  )
  const selectedRaceOptions = useMemo(
    () => raceOptions.filter((item) => editAllowedRaceKeys.includes(item.value)),
    [raceOptions, editAllowedRaceKeys],
  )
  const selectedClassOptions = useMemo(
    () => classOptions.filter((item) => editAllowedClassKeys.includes(item.value)),
    [classOptions, editAllowedClassKeys],
  )
  const filteredBooks = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return books

    return books.filter((book) =>
      book.title.toLowerCase().includes(normalized) ||
      (book.description ?? "").toLowerCase().includes(normalized),
    )
  }, [books, search])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")
      const payload = await loadLibrarySectionBooksUseCase(deps, { rpgId, sectionId })
      setSection(payload.section)
      setBooks(payload.books)
      setCanManage(payload.canManage)
      setPlayerOptions(
        payload.players.map((item) => ({
          value: item.id,
          label: item.name ? `@${item.username} - ${item.name}` : `@${item.username}`,
        })),
      )
      setRaceOptions(payload.races.map((item) => ({ value: item.key, label: item.label })))
      setClassOptions(payload.classes.map((item) => ({ value: item.key, label: item.label })))
    } catch (cause) {
      setLoadingError(
        cause instanceof Error ? cause.message : "Erro de conexao ao carregar biblioteca.",
      )
    } finally {
      setLoading(false)
    }
  }, [deps, rpgId, sectionId])

  useEffect(() => {
    if (rpgId && sectionId) void loadData()
  }, [loadData, rpgId, sectionId])

  async function handleDelete(bookId: string) {
    if (!canManage) return
    const confirmed = window.confirm("Tem certeza que deseja apagar este livro?")
    if (!confirmed) return

    try {
      setDeletingId(bookId)
      const loadingToastId = toast.loading("Apagando livro...")
      await deleteLibraryBookUseCase(deps, { rpgId, bookId })
      setBooks((prev) => prev.filter((book) => book.id !== bookId))
      dismissToast(loadingToastId)
      toast.success("Livro apagado com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro de conexao ao apagar livro."
      setLoadingError(message)
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  function openCreateModal() {
    setCreateTitle("")
    setCreateDescription("")
    setCreateVisibility("private")
    setCreateError("")
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    if (savingCreate) return
    setIsCreateModalOpen(false)
    setCreateTitle("")
    setCreateDescription("")
    setCreateVisibility("private")
    setCreateError("")
  }

  async function handleCreateDraftBook() {
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
          description: normalizedDescription ? normalizedDescription : null,
          content: { type: "doc", content: [] },
          visibility: createVisibility,
          allowedCharacterIds: [],
          allowedClassKeys: [],
          allowedRaceKeys: [],
        },
      })

      setBooks((prev) => [book, ...prev])
      closeCreateModal()
      router.push(`/rpg/${rpgId}/library/${sectionId}/books/${book.id}/edit`)
      toast.success("Livro criado com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro de conexao ao criar livro."
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
    setEditAllowedUserIds(Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [])
    setEditAllowedRaceKeys(Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [])
    setEditAllowedClassKeys(Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [])
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

  async function handleSaveBookMeta() {
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
          description: editDescription.trim() ? editDescription.trim() : null,
          content: editingBook.content,
          visibility: editVisibility,
          allowedCharacterIds: editVisibility === "private" ? editAllowedUserIds : [],
          allowedClassKeys: editVisibility === "private" ? editAllowedClassKeys : [],
          allowedRaceKeys: editVisibility === "private" ? editAllowedRaceKeys : [],
        },
      })
      setBooks((prev) => prev.map((item) => (item.id === book.id ? book : item)))
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

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>Biblioteca</p>
          <h1 className={styles.title}>{section?.title ?? "Biblioteca"}</h1>
        </div>
        <div className={styles.headerActions}>
          {canManage ? (
            <button className={styles.primaryButton} type="button" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Novo livro</span>
            </button>
          ) : null}
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.searchRow}>
          <label className={styles.field}>
            <div className={styles.searchInputWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
              />
            </div>
          </label>
        </div>
      </section>

      {loading ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>Carregando livros...</p>
        </section>
      ) : null}
      {loadingError ? (
        <section className={styles.emptyState}>
          <p className={styles.error}>{loadingError}</p>
        </section>
      ) : null}
      {!loading && !loadingError && filteredBooks.length === 0 ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>Nenhum livro encontrado com os filtros atuais.</p>
        </section>
      ) : null}

      {!loading && !loadingError && filteredBooks.length > 0 ? (
        <section className={styles.listPanel}>
          <div className={styles.grid}>
            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className={styles.bookCard}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/rpg/${rpgId}/library/${sectionId}/books/${book.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    router.push(`/rpg/${rpgId}/library/${sectionId}/books/${book.id}`)
                  }
                }}
              >
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{book.title}</h2>
                </div>
                <p className={styles.bookDescription}>{book.description || "Sem descricao cadastrada."}</p>
                <div className={styles.metaList}>
                  <p className={styles.bookMeta}>Criado: {formatDate(book.createdAt)}</p>
                  <p className={styles.bookMeta}>Atualizado: {formatDate(book.updatedAt)}</p>
                </div>
                  {book.canEdit ? (
                    <div className={styles.cardFooter}>
                      <div className={styles.cardActions}>
                        {canManage && book.canEdit ? (
                          <>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={(event) => {
                              event.stopPropagation()
                              openEditModal(book)
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleDelete(book.id)
                            }}
                            disabled={deletingId === book.id}
                          >
                            {deletingId === book.id ? "Apagando..." : "Apagar"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {editingBook ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Editar livro">
          <section className={styles.modal}>
            <h2 className={styles.modalTitle}>Editar livro</h2>
            <label className={styles.field}>
              <span>Nome do livro</span>
              <input
                type="text"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                minLength={2}
                maxLength={160}
                required
                disabled={savingEdit}
              />
            </label>
            <label className={styles.field}>
              <span>Visibilidade</span>
              <select
                value={editVisibility}
                  onChange={(event) =>
                    setEditVisibility(event.target.value as "private" | "public" | "unlisted")
                  }
                  disabled={savingEdit}
                >
                  <option value="private">Privada</option>
                  <option value="public">Publica</option>
                  <option value="unlisted">Por link</option>
                </select>
              </label>
            <label className={styles.field}>
              <span>Descricao basica</span>
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                maxLength={280}
                rows={4}
                placeholder="Resumo curto do livro"
                disabled={savingEdit}
              />
            </label>
            {editVisibility === "private" ? (
              <>
                <label className={styles.field}>
                  <span>Players permitidos</span>
                  <ReactMultiSelectField
                    options={playerOptions}
                    value={selectedPlayerOptions}
                    onChange={(options) => setEditAllowedUserIds(options.map((item) => item.value))}
                    isDisabled={savingEdit}
                    placeholder="Selecione usuarios do RPG"
                  />
                </label>
                {raceOptions.length > 0 ? (
                  <label className={styles.field}>
                    <span>Racas permitidas</span>
                    <ReactMultiSelectField
                      options={raceOptions}
                      value={selectedRaceOptions}
                      onChange={(options) => setEditAllowedRaceKeys(options.map((item) => item.value))}
                      isDisabled={savingEdit}
                      placeholder="Selecione racas"
                    />
                  </label>
                ) : null}
                {classOptions.length > 0 ? (
                  <label className={styles.field}>
                    <span>Classes permitidas</span>
                    <ReactMultiSelectField
                      options={classOptions}
                      value={selectedClassOptions}
                      onChange={(options) => setEditAllowedClassKeys(options.map((item) => item.value))}
                      isDisabled={savingEdit}
                      placeholder="Selecione classes"
                    />
                  </label>
                ) : null}
              </>
            ) : null}
            {editError ? <p className={styles.error}>{editError}</p> : null}
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void handleSaveBookMeta()}
                disabled={savingEdit}
              >
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => closeEditModal()}
                disabled={savingEdit}
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Criar livro">
          <section className={`${styles.modal} ${styles.createModal}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Criar livro</h2>
              <button type="button" className={styles.secondaryButton} onClick={closeCreateModal}>
                Fechar
              </button>
            </div>

            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                value={createTitle}
                onChange={(event) => setCreateTitle(event.target.value)}
                minLength={2}
                maxLength={160}
                placeholder="Nome do livro"
                disabled={savingCreate}
              />
            </label>

            <label className={styles.field}>
              <span>Descricao</span>
              <textarea
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
                maxLength={280}
                rows={4}
                placeholder="Resumo curto do livro"
                disabled={savingCreate}
              />
            </label>

            <label className={styles.field}>
              <span>Visibilidade</span>
              <select
                value={createVisibility}
                  onChange={(event) =>
                    setCreateVisibility(event.target.value as "private" | "public" | "unlisted")
                  }
                  disabled={savingCreate}
                >
                  <option value="private">Privada</option>
                  <option value="public">Publica</option>
                  <option value="unlisted">Por link</option>
                </select>
              </label>

            {createError ? <p className={styles.error}>{createError}</p> : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.primaryButton} onClick={() => void handleCreateDraftBook()}>
                <Plus size={16} />
                <span>{savingCreate ? "Criando..." : "Criar e abrir"}</span>
              </button>
              <button type="button" className={styles.secondaryButton} onClick={closeCreateModal} disabled={savingCreate}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
