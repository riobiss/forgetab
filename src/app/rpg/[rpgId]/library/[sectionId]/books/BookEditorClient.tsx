"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import styles from "./BookEditorClient.module.css"

type Props = {
  mode: "create" | "edit"
  bookId?: string
  forceReadOnly?: boolean
}

type LibraryBook = {
  id: string
  title: string
  description: string | null
  sectionId: string
  content: JSONContent
  visibility: "private" | "public"
  allowedCharacterIds: string[]
  allowedClassKeys: string[]
  allowedRaceKeys: string[]
}

const EMPTY_DOC: JSONContent = { type: "doc", content: [] }

export default function BookEditorClient({ mode, bookId, forceReadOnly = false }: Props) {
  const params = useParams<{ rpgId: string; sectionId: string }>()
  const rpgId = params.rpgId
  const sectionId = params.sectionId
  const isEdit = mode === "edit"

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("Novo livro")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [allowedCharacterIds, setAllowedCharacterIds] = useState<string[]>([])
  const [allowedClassKeys, setAllowedClassKeys] = useState<string[]>([])
  const [allowedRaceKeys, setAllowedRaceKeys] = useState<string[]>([])
  const [jsonContent, setJsonContent] = useState<JSONContent>(EMPTY_DOC)
  const [editorKey, setEditorKey] = useState("new")
  const [canEdit, setCanEdit] = useState(!isEdit && !forceReadOnly)
  const [currentBookId, setCurrentBookId] = useState<string | null>(bookId ?? null)

  useEffect(() => {
    async function loadBook() {
      if (!isEdit || !bookId) return

      try {
        setLoading(true)
        const response = await fetch(`/api/rpg/${rpgId}/library/books/${bookId}`)
        const payload = (await response.json()) as {
          book?: LibraryBook
          canEdit?: boolean
          message?: string
        }
        if (!response.ok || !payload.book) {
          throw new Error(payload.message ?? "Nao foi possivel carregar livro.")
        }

        const book = payload.book
        setTitle(book.title)
        setDescription(book.description ?? "")
        setVisibility(book.visibility)
        setAllowedCharacterIds(Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [])
        setAllowedClassKeys(Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [])
        setAllowedRaceKeys(Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [])
        setJsonContent(book.content ?? EMPTY_DOC)
        setEditorKey(`edit-${book.id}`)
        setCanEdit(Boolean(payload.canEdit) && !forceReadOnly)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erro ao carregar livro.")
      } finally {
        setLoading(false)
      }
    }

    void loadBook()
  }, [bookId, forceReadOnly, isEdit, rpgId])

  async function handleSave() {
    if (saving || !canEdit) return
    setSaving(true)
    setError("")

    try {
      console.log("library-book-json", jsonContent)
      const endpoint = currentBookId
        ? `/api/rpg/${rpgId}/library/books/${currentBookId}`
        : `/api/rpg/${rpgId}/library/sections/${sectionId}/books`
      const method = currentBookId ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() ? description.trim() : null,
          content: jsonContent,
          visibility,
          allowedCharacterIds,
          allowedClassKeys,
          allowedRaceKeys,
        }),
      })

      const payload = (await response.json()) as { book?: LibraryBook; message?: string }
      if (!response.ok || !payload.book) {
        throw new Error(payload.message ?? "Nao foi possivel salvar livro.")
      }
      if (!currentBookId) {
        setCurrentBookId(payload.book.id)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro de conexao ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.feedback}>Carregando editor...</p>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.editorCard} ${!canEdit ? styles.readOnlyBody : ""}`}>
        <SimpleEditor
          key={editorKey}
          initialContent={jsonContent}
          onJsonChange={setJsonContent}
          disabled={!canEdit}
          className="library-book-editor"
          onSave={() => void handleSave()}
          canSave={canEdit}
          isSaving={saving}
        />
      </section>
      {error ? <p className={styles.error}>{error}</p> : null}
    </main>
  )
}
