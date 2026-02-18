"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
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
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setLoadingError("")
        await Promise.all([loadSection(), loadBooks()])
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
  }, [loadBooks, loadSection, rpgId, sectionId])

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
            <article key={book.id} className={styles.bookCard}>
              <h3>{book.title}</h3>
              <p className={styles.bookMeta}>Atualizado em: {formatDate(book.updatedAt)}</p>
              <p className={styles.bookMeta}>
                Visibilidade: {book.visibility === "public" ? "Publica" : "Privada"}
              </p>
              {canManage ? (
                <div className={styles.cardActions}>
                  <Link
                    href={`/rpg/${rpgId}/library/${sectionId}/books/${book.id}/edit`}
                    className={styles.ghostButton}
                  >
                    Editar
                  </Link>
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
