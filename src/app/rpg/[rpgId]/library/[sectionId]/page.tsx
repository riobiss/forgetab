"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import { ReactMultiSelectField } from "@/components/select/ReactMultiSelectField"
import styles from "./page.module.css"

type LibrarySection = {
  id: string
  rpgId: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

type LibraryBook = {
  id: string
  rpgId: string
  sectionId: string
  title: string
  description: string | null
  content: JSONContent
  canEdit?: boolean
  createdByUserId?: string | null
  visibility: "private" | "public"
  allowedCharacterIds: string[]
  allowedClassKeys: string[]
  allowedRaceKeys: string[]
  createdAt: string
  updatedAt: string
}

type SectionPayload = {
  section?: LibrarySection
  canManage?: boolean
  message?: string
}

type BooksPayload = {
  books?: LibraryBook[]
  canManage?: boolean
  message?: string
}

type RpgUserOption = {
  id: string
  username: string
  name: string
}

type RaceOption = {
  key: string
  label: string
}

type ClassOption = {
  key: string
  label: string
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR")
}

export default function LibraryBooksPage() {
  const params = useParams<{ rpgId: string; sectionId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId
  const sectionId = params.sectionId

  const [section, setSection] = useState<LibrarySection | null>(null)
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editVisibility, setEditVisibility] = useState<"private" | "public">("private")
  const [editAllowedUserIds, setEditAllowedUserIds] = useState<string[]>([])
  const [editAllowedRaceKeys, setEditAllowedRaceKeys] = useState<string[]>([])
  const [editAllowedClassKeys, setEditAllowedClassKeys] = useState<string[]>([])
  const [playerOptions, setPlayerOptions] = useState<RpgUserOption[]>([])
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([])
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState("")

  const playerSelectOptions = useMemo<ReactSelectOption[]>(
    () =>
      playerOptions.map((item) => ({
        value: item.id,
        label: item.name ? `@${item.username} - ${item.name}` : `@${item.username}`,
      })),
    [playerOptions],
  )

  const raceSelectOptions = useMemo<ReactSelectOption[]>(
    () => raceOptions.map((item) => ({ value: item.key, label: item.label })),
    [raceOptions],
  )

  const classSelectOptions = useMemo<ReactSelectOption[]>(
    () => classOptions.map((item) => ({ value: item.key, label: item.label })),
    [classOptions],
  )

  const selectedPlayerOptions = useMemo(
    () => playerSelectOptions.filter((item) => editAllowedUserIds.includes(item.value)),
    [playerSelectOptions, editAllowedUserIds],
  )
  const selectedRaceOptions = useMemo(
    () => raceSelectOptions.filter((item) => editAllowedRaceKeys.includes(item.value)),
    [raceSelectOptions, editAllowedRaceKeys],
  )
  const selectedClassOptions = useMemo(
    () => classSelectOptions.filter((item) => editAllowedClassKeys.includes(item.value)),
    [classSelectOptions, editAllowedClassKeys],
  )

  const loadSection = useCallback(async () => {
    const response = await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}`)
    const payload = (await response.json()) as SectionPayload
    if (!response.ok || !payload.section) {
      throw new Error(payload.message ?? "Nao foi possivel carregar a secao.")
    }

    setSection(payload.section)
    setCanManage(Boolean(payload.canManage))
  }, [rpgId, sectionId])

  const loadBooks = useCallback(async () => {
    const response = await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}/books`)
    const payload = (await response.json()) as BooksPayload
    if (!response.ok) {
      throw new Error(payload.message ?? "Nao foi possivel carregar livros.")
    }

    setBooks(payload.books ?? [])
    setCanManage(Boolean(payload.canManage))
  }, [rpgId, sectionId])

  const loadVisibilityOptions = useCallback(async () => {
    const [membersResponse, racesResponse, classesResponse] = await Promise.all([
      fetch(`/api/rpg/${rpgId}/members`),
      fetch(`/api/rpg/${rpgId}/races`),
      fetch(`/api/rpg/${rpgId}/classes`),
    ])

    const membersPayload = (await membersResponse.json()) as {
      users?: RpgUserOption[]
      message?: string
    }
    const racesPayload = (await racesResponse.json()) as {
      races?: RaceOption[]
      message?: string
    }
    const classesPayload = (await classesResponse.json()) as {
      classes?: ClassOption[]
      message?: string
    }

    if (!membersResponse.ok) {
      throw new Error(membersPayload.message ?? "Nao foi possivel carregar players.")
    }
    if (!racesResponse.ok) {
      throw new Error(racesPayload.message ?? "Nao foi possivel carregar racas.")
    }
    if (!classesResponse.ok) {
      throw new Error(classesPayload.message ?? "Nao foi possivel carregar classes.")
    }

    setPlayerOptions(membersPayload.users ?? [])
    setRaceOptions(racesPayload.races ?? [])
    setClassOptions(classesPayload.classes ?? [])
  }, [rpgId])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setLoadingError("")
        await Promise.all([loadSection(), loadBooks(), loadVisibilityOptions()])
      } catch (error) {
        if (error instanceof Error) {
          setLoadingError(error.message)
        } else {
          setLoadingError("Erro de conexao ao carregar biblioteca.")
        }
      } finally {
        setLoading(false)
      }
    }

    if (rpgId && sectionId) {
      void loadData()
    }
  }, [loadBooks, loadSection, loadVisibilityOptions, rpgId, sectionId])

  async function handleDelete(bookId: string) {
    if (!canManage) return
    const confirmed = window.confirm("Tem certeza que deseja apagar este livro?")
    if (!confirmed) return

    try {
      setDeletingId(bookId)
      const response = await fetch(`/api/rpg/${rpgId}/library/books/${bookId}`, { method: "DELETE" })
      const payload = (await response.json()) as { message?: string }
      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel apagar livro.")
        return
      }

      setBooks((prev) => prev.filter((book) => book.id !== bookId))
    } catch {
      setLoadingError("Erro de conexao ao apagar livro.")
    } finally {
      setDeletingId(null)
    }
  }

  function openEditModal(book: LibraryBook) {
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

    try {
      const response = await fetch(`/api/rpg/${rpgId}/library/books/${editingBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() ? editDescription.trim() : null,
          content: editingBook.content,
          visibility: editVisibility,
          allowedCharacterIds: editVisibility === "private" ? editAllowedUserIds : [],
          allowedClassKeys: editVisibility === "private" ? editAllowedClassKeys : [],
          allowedRaceKeys: editVisibility === "private" ? editAllowedRaceKeys : [],
        }),
      })

      const payload = (await response.json()) as { book?: LibraryBook; message?: string }
      if (!response.ok || !payload.book) {
        setEditError(payload.message ?? "Nao foi possivel salvar configuracoes do livro.")
        return
      }

      setBooks((prev) => prev.map((book) => (book.id === payload.book?.id ? payload.book : book)))
      closeEditModal(true)
    } catch {
      setEditError("Erro de conexao ao salvar configuracoes do livro.")
    } finally {
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
            <Link
              className={styles.primaryButton}
              href={`/rpg/${rpgId}/library/${sectionId}/books/new`}
            >
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
                    options={playerSelectOptions}
                    value={selectedPlayerOptions}
                    onChange={(options) => setEditAllowedUserIds(options.map((item) => item.value))}
                    isDisabled={savingEdit}
                    placeholder="Selecione usuarios do RPG"
                  />
                </label>
                {raceSelectOptions.length > 0 ? (
                  <label className={styles.field}>
                    <span>Racas permitidas</span>
                    <ReactMultiSelectField
                      options={raceSelectOptions}
                      value={selectedRaceOptions}
                      onChange={(options) => setEditAllowedRaceKeys(options.map((item) => item.value))}
                      isDisabled={savingEdit}
                      placeholder="Selecione racas"
                    />
                  </label>
                ) : null}
                {classSelectOptions.length > 0 ? (
                  <label className={styles.field}>
                    <span>Classes permitidas</span>
                    <ReactMultiSelectField
                      options={classSelectOptions}
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
                className={styles.ghostButton}
                onClick={() => closeEditModal()}
                disabled={savingEdit}
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
