"use client"

import { useEffect, useState } from "react"
import type { JSONContent } from "@tiptap/react"
import { toast } from "react-hot-toast"
import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import {
  createLibraryBookUseCase,
  loadLibraryBookUseCase,
  updateLibraryBookUseCase,
} from "@/application/library/use-cases/library"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { dismissToast } from "@/lib/toast"
import styles from "./LibraryBookEditorClient.module.css"

type Props = {
  rpgId: string
  sectionId: string
  mode: "create" | "edit"
  bookId?: string
  forceReadOnly?: boolean
  deps: LibraryDependencies
}

const EMPTY_DOC: JSONContent = { type: "doc", content: [] }

export default function LibraryBookEditorClient({
  rpgId,
  sectionId,
  mode,
  bookId,
  forceReadOnly = false,
  deps,
}: Props) {
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
        const payload = await loadLibraryBookUseCase(deps, { rpgId, bookId })
        const book = payload.book
        setTitle(book.title)
        setDescription(book.description ?? "")
        setVisibility(book.visibility)
        setAllowedCharacterIds(Array.isArray(book.allowedCharacterIds) ? book.allowedCharacterIds : [])
        setAllowedClassKeys(Array.isArray(book.allowedClassKeys) ? book.allowedClassKeys : [])
        setAllowedRaceKeys(Array.isArray(book.allowedRaceKeys) ? book.allowedRaceKeys : [])
        setJsonContent(book.content ?? EMPTY_DOC)
        setEditorKey(`edit-${book.id}`)
        setCanEdit(payload.canEdit && !forceReadOnly)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro ao carregar livro.")
      } finally {
        setLoading(false)
      }
    }

    void loadBook()
  }, [bookId, deps, forceReadOnly, isEdit, rpgId])

  async function handleSave() {
    if (saving || !canEdit) return
    setSaving(true)
    setError("")
    const loadingToastId = toast.loading(currentBookId ? "Salvando livro..." : "Criando livro...")

    try {
      const payload = {
        title,
        description: description.trim() ? description.trim() : null,
        content: jsonContent,
        visibility,
        allowedCharacterIds,
        allowedClassKeys,
        allowedRaceKeys,
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

      if (!currentBookId) setCurrentBookId(book.id)
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
