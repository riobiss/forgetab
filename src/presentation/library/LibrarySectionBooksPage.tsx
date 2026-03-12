"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import { ReactMultiSelectField } from "@/components/select/ReactMultiSelectField"
import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import {
  deleteLibraryBookUseCase,
  loadLibrarySectionBooksUseCase,
  updateLibraryBookUseCase,
} from "@/application/library/use-cases/library"
import type { LibraryBookDto, LibrarySectionDto } from "@/application/library/types"
import { dismissToast } from "@/lib/toast"
import styles from "./LibrarySectionBooksPage.module.css"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR")
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
  const [editingBook, setEditingBook] = useState<LibraryBookDto | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editVisibility, setEditVisibility] = useState<"private" | "public">("private")
  const [editAllowedUserIds, setEditAllowedUserIds] = useState<string[]>([])
  const [editAllowedRaceKeys, setEditAllowedRaceKeys] = useState<string[]>([])
  const [editAllowedClassKeys, setEditAllowedClassKeys] = useState<string[]>([])
  const [playerOptions, setPlayerOptions] = useState<ReactSelectOption[]>([])
  const [raceOptions, setRaceOptions] = useState<ReactSelectOption[]>([])
  const [classOptions, setClassOptions] = useState<ReactSelectOption[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState("")

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
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Biblioteca</p>
          <h1 className={styles.title}>{section?.title ?? "Sessao"}</h1>
          <p className={styles.subtitle}>{section?.description ?? "Sem descricao da sessao."}</p>
        </div>
        {canManage ? (
          <div className={styles.headerActions}>
            <Link className={styles.primaryButton} href={`/rpg/${rpgId}/library/${sectionId}/books/new`}>
              Criar livro
            </Link>
          </div>
        ) : null}
      </div>

      {loading ? <p className={styles.feedback}>Carregando livros...</p> : null}
      {loadingError ? <p className={styles.error}>{loadingError}</p> : null}
      {!loading && !loadingError && books.length === 0 ? (
        <p className={styles.feedback}>Nenhum livro cadastrado nesta sessao.</p>
      ) : null}

      {!loading && !loadingError && books.length > 0 ? (
        <section className={styles.books}>
          {books.map((book) => (
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
              <h3>{book.title}</h3>
              <p className={styles.bookDescription}>{book.description || "Sem descricao."}</p>
              <p className={styles.bookMeta}>Atualizado em: {formatDate(book.updatedAt)}</p>
              <p className={styles.bookMeta}>
                Visibilidade: {book.visibility === "public" ? "Publica" : "Privada"}
              </p>
              {book.canEdit ? (
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      router.push(`/rpg/${rpgId}/library/${sectionId}/books/${book.id}/edit`)
                    }}
                  >
                    Escrever
                  </button>
                  {canManage && book.canEdit ? (
                    <>
                      <button
                        type="button"
                        className={styles.ghostButton}
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
              ) : null}
            </article>
          ))}
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
                onChange={(event) => setEditVisibility(event.target.value as "private" | "public")}
                disabled={savingEdit}
              >
                <option value="private">Privada</option>
                <option value="public">Publica</option>
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
              <button type="button" className={styles.primaryButton} onClick={() => void handleSaveBookMeta()} disabled={savingEdit}>
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => closeEditModal()} disabled={savingEdit}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
