"use client"

import Link from "next/link"
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import styles from "./page.module.css"

type LibrarySection = {
  id: string
  rpgId: string
  title: string
  description: string | null
  booksCount: number
  createdAt: string
  updatedAt: string
}

type SectionsPayload = {
  sections?: LibrarySection[]
  canManage?: boolean
  message?: string
}

export default function LibrarySectionsPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId

  const [sections, setSections] = useState<LibrarySection[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const savingRef = useRef(false)

  const filteredSections = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return sections

    return sections.filter((section) => {
      return (
        section.title.toLowerCase().includes(normalized) ||
        (section.description ?? "").toLowerCase().includes(normalized)
      )
    })
  }, [search, sections])

  const loadSections = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")

      const response = await fetch(`/api/rpg/${rpgId}/library/sections`)
      const payload = (await response.json()) as SectionsPayload

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel carregar secoes da biblioteca.")
        setSections([])
        setCanManage(false)
        return
      }

      setSections(payload.sections ?? [])
      setCanManage(Boolean(payload.canManage))
    } catch {
      setLoadingError("Erro de conexao ao carregar secoes da biblioteca.")
      setSections([])
      setCanManage(false)
    } finally {
      setLoading(false)
    }
  }, [rpgId])

  useEffect(() => {
    if (rpgId) {
      void loadSections()
    }
  }, [loadSections, rpgId])

  function resetForm() {
    setEditingId(null)
    setTitle("")
    setDescription("")
    setSubmitError("")
  }

  function closeModal() {
    setIsModalOpen(false)
    resetForm()
  }

  function openCreateModal() {
    resetForm()
    setIsModalOpen(true)
  }

  function startEdit(section: LibrarySection) {
    setEditingId(section.id)
    setTitle(section.title)
    setDescription(section.description ?? "")
    setSubmitError("")
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current || !canManage) return

    savingRef.current = true
    setSaving(true)
    setSubmitError("")

    try {
      const endpoint = editingId
        ? `/api/rpg/${rpgId}/library/sections/${editingId}`
        : `/api/rpg/${rpgId}/library/sections`
      const method = editingId ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() ? description.trim() : null,
        }),
      })
      const payload = (await response.json()) as { section?: LibrarySection; message?: string }

      if (!response.ok || !payload.section) {
        setSubmitError(payload.message ?? "Nao foi possivel salvar a secao.")
        return
      }

      if (editingId) {
        setSections((prev) => prev.map((item) => (item.id === payload.section?.id ? payload.section : item)))
      } else {
        setSections((prev) => [payload.section as LibrarySection, ...prev])
      }
      closeModal()
    } catch {
      setSubmitError("Erro de conexao ao salvar secao.")
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  async function handleDelete(sectionId: string) {
    if (!canManage) return
    const confirmed = window.confirm("Tem certeza que deseja apagar esta sessao e seus livros?")
    if (!confirmed) return

    try {
      setDeletingId(sectionId)
      const response = await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel remover a secao.")
        return
      }

      setSections((prev) => prev.filter((item) => item.id !== sectionId))
      if (editingId === sectionId) {
        resetForm()
      }
    } catch {
      setLoadingError("Erro de conexao ao remover secao.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Biblioteca</p>
          <h1 className={styles.title}>Sessoes da Biblioteca</h1>
          <p className={styles.subtitle}>
            Crie locais de livros especificos para organizar o lore do seu RPG.
          </p>
        </div>
        <div className={styles.headerActions}>
          {canManage ? (
            <button type="button" className={styles.primaryButton} onClick={openCreateModal}>
              Criar sessao
            </button>
          ) : null}
          <Link href={`/rpg/${rpgId}`} className={styles.ghostButton}>
            Voltar ao RPG
          </Link>
        </div>
      </div>

      <section className={styles.panel}>
        <label className={styles.field}>
          <span>Buscar sessoes</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome da sessao ou descricao"
          />
        </label>
      </section>

      {canManage && isModalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Criar sessao">
          <section className={styles.modal}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>{editingId ? "Editar sessao" : "Nova sessao"}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Descricao</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="Opcional"
                />
              </label>
              {submitError ? <p className={styles.error}>{submitError}</p> : null}
              <div className={styles.headerActions}>
                <button type="submit" className={styles.primaryButton} disabled={saving}>
                  {saving ? "Salvando..." : editingId ? "Salvar edicao" : "Adicionar sessao"}
                </button>
                <button type="button" className={styles.ghostButton} onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {loading ? <p className={styles.feedback}>Carregando sessoes...</p> : null}
      {loadingError ? <p className={styles.error}>{loadingError}</p> : null}
      {!loading && !loadingError && filteredSections.length === 0 ? (
        <p className={styles.feedback}>Nenhuma sessao encontrada.</p>
      ) : null}

      {!loading && !loadingError && filteredSections.length > 0 ? (
        <section className={styles.cards}>
          {filteredSections.map((section) => (
            <article
              key={section.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/rpg/${rpgId}/library/${section.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  router.push(`/rpg/${rpgId}/library/${section.id}`)
                }
              }}
            >
              <h3>{section.title}</h3>
              <p>{section.description || "Sem descricao."}</p>
              <span className={styles.count}>{section.booksCount} livro(s)</span>
              <div className={styles.cardActions}>
                {canManage ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      startEdit(section)
                    }}
                  >
                    Editar
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleDelete(section.id)
                    }}
                    disabled={deletingId === section.id}
                  >
                    {deletingId === section.id ? "Apagando..." : "Apagar"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
