"use client"

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import styles from "./page.module.css"
import LibraryRichEditor from "../components/LibraryRichEditor"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import { ReactMultiSelectField } from "@/components/select/ReactMultiSelectField"

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
  content: JSONContent
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
  name: string
  email: string
}

type RaceOption = {
  key: string
  label: string
}

type ClassOption = {
  key: string
  label: string
}

const EMPTY_DOC: JSONContent = { type: "doc", content: [] }

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR")
}

export default function LibraryBooksPage() {
  const params = useParams<{ rpgId: string; sectionId: string }>()
  const rpgId = params.rpgId
  const sectionId = params.sectionId

  const [section, setSection] = useState<LibrarySection | null>(null)
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<JSONContent>(EMPTY_DOC)
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedRaceKeys, setSelectedRaceKeys] = useState<string[]>([])
  const [selectedClassKeys, setSelectedClassKeys] = useState<string[]>([])
  const [playerOptions, setPlayerOptions] = useState<RpgUserOption[]>([])
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([])
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const savingRef = useRef(false)

  const playerSelectOptions = useMemo<ReactSelectOption[]>(
    () =>
      playerOptions.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.email})`,
      })),
    [playerOptions],
  )

  const raceSelectOptions = useMemo<ReactSelectOption[]>(
    () =>
      raceOptions.map((item) => ({
        value: item.key,
        label: item.label,
      })),
    [raceOptions],
  )

  const classSelectOptions = useMemo<ReactSelectOption[]>(
    () =>
      classOptions.map((item) => ({
        value: item.key,
        label: item.label,
      })),
    [classOptions],
  )

  const selectedPlayerOptions = useMemo(
    () => playerSelectOptions.filter((item) => selectedUserIds.includes(item.value)),
    [playerSelectOptions, selectedUserIds],
  )

  const selectedRaceOptions = useMemo(
    () => raceSelectOptions.filter((item) => selectedRaceKeys.includes(item.value)),
    [raceSelectOptions, selectedRaceKeys],
  )

  const selectedClassOptions = useMemo(
    () => classSelectOptions.filter((item) => selectedClassKeys.includes(item.value)),
    [classSelectOptions, selectedClassKeys],
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

  function resetBookForm() {
    setEditingBookId(null)
    setTitle("")
    setContent(EMPTY_DOC)
    setVisibility("private")
    setSelectedUserIds([])
    setSelectedRaceKeys([])
    setSelectedClassKeys([])
    setSubmitError("")
  }

  function startBookEdit(book: LibraryBook) {
    setEditingBookId(book.id)
    setTitle(book.title)
    setContent(book.content ?? EMPTY_DOC)
    setVisibility(book.visibility ?? "private")
    setSelectedUserIds(Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [])
    setSelectedRaceKeys(Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [])
    setSelectedClassKeys(Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [])
    setSubmitError("")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current || !canManage) return

    savingRef.current = true
    setSaving(true)
    setSubmitError("")

    try {
      const endpoint = editingBookId
        ? `/api/rpg/${rpgId}/library/books/${editingBookId}`
        : `/api/rpg/${rpgId}/library/sections/${sectionId}/books`
      const method = editingBookId ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          visibility,
          allowedCharacterIds: visibility === "private" ? selectedUserIds : [],
          allowedClassKeys: visibility === "private" ? selectedClassKeys : [],
          allowedRaceKeys: visibility === "private" ? selectedRaceKeys : [],
        }),
      })

      const payload = (await response.json()) as { book?: LibraryBook; message?: string }
      if (!response.ok || !payload.book) {
        setSubmitError(payload.message ?? "Nao foi possivel salvar livro.")
        return
      }

      if (editingBookId) {
        setBooks((prev) => prev.map((item) => (item.id === payload.book?.id ? payload.book : item)))
      } else {
        setBooks((prev) => [payload.book as LibraryBook, ...prev])
      }
      resetBookForm()
    } catch {
      setSubmitError("Erro de conexao ao salvar livro.")
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

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
      if (editingBookId === bookId) {
        resetBookForm()
      }
    } catch {
      setLoadingError("Erro de conexao ao apagar livro.")
    } finally {
      setDeletingId(null)
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
        
      </div>

      {canManage ? (
        <section className={styles.panel}>
          <form className={styles.panel} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>{editingBookId ? "Editar livro" : "Criar livro"}</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={2}
                maxLength={160}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Visibilidade</span>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as "private" | "public")}
                disabled={saving}
              >
                <option value="private">Privada</option>
                <option value="public">Publica</option>
              </select>
            </label>

            {visibility === "private" ? (
              <>
                <label className={styles.field}>
                  <span>Players permitidos</span>
                  <ReactMultiSelectField
                    options={playerSelectOptions}
                    value={selectedPlayerOptions}
                    onChange={(options) => setSelectedUserIds(options.map((option) => option.value))}
                    isDisabled={saving}
                    placeholder="Selecione usuarios do RPG"
                  />
                </label>
                {raceSelectOptions.length > 0 ? (
                  <label className={styles.field}>
                    <span>Racas permitidas</span>
                    <ReactMultiSelectField
                      options={raceSelectOptions}
                      value={selectedRaceOptions}
                      onChange={(options) => setSelectedRaceKeys(options.map((option) => option.value))}
                      isDisabled={saving}
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
                      onChange={(options) => setSelectedClassKeys(options.map((option) => option.value))}
                      isDisabled={saving}
                      placeholder="Selecione classes"
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            <LibraryRichEditor value={content} onChange={setContent} disabled={saving} />

            {submitError ? <p className={styles.error}>{submitError}</p> : null}
            <div className={styles.headerActions}>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? "Salvando..." : editingBookId ? "Salvar livro" : "Criar livro"}
              </button>
              {editingBookId ? (
                <button type="button" className={styles.ghostButton} onClick={resetBookForm}>
                  Cancelar edicao
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {loading ? <p className={styles.feedback}>Carregando livros...</p> : null}
      {loadingError ? <p className={styles.error}>{loadingError}</p> : null}
      {!loading && !loadingError && books.length === 0 ? (
        <p className={styles.feedback}>Nenhum livro cadastrado nesta sessao.</p>
      ) : null}

      {!loading && !loadingError && books.length > 0 ? (
        <section className={styles.books}>
          {books.map((book) => (
            <article key={book.id} className={styles.bookCard}>
              <h3>{book.title}</h3>
              <p className={styles.bookMeta}>Atualizado em: {formatDate(book.updatedAt)}</p>
              <p className={styles.bookMeta}>
                Visibilidade: {book.visibility === "public" ? "Publica" : "Privada"}
              </p>
              {canManage ? (
                <div className={styles.cardActions}>
                  <button type="button" className={styles.ghostButton} onClick={() => startBookEdit(book)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => void handleDelete(book.id)}
                    disabled={deletingId === book.id}
                  >
                    {deletingId === book.id ? "Apagando..." : "Apagar"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
