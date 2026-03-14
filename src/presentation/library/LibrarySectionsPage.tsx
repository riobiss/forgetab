"use client"

import { FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Plus, Search, Star } from "lucide-react"
import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import {
  createLibrarySectionUseCase,
  deleteLibrarySectionUseCase,
  loadLibrarySectionsUseCase,
  updateLibrarySectionUseCase,
} from "@/application/library/use-cases/library"
import type { LibrarySectionDto } from "@/application/library/types"
import { dismissToast } from "@/lib/toast"
import styles from "./LibrarySectionsPage.module.css"

type Props = {
  rpgId: string
  rpgTitle: string
  deps: LibraryDependencies
}

export default function LibrarySectionsPage({ rpgId, rpgTitle, deps }: Props) {
  const router = useRouter()
  const [sections, setSections] = useState<LibrarySectionDto[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("public")
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const savingRef = useRef(false)
  const deferredSearch = useDeferredValue(search)
  const favoriteStorageKey = `library:sections:favorites:${rpgId}`

  const filteredSections = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase()
    const favoriteIdSet = new Set(favoriteIds)
    const source = favoritesOnly
      ? sections.filter((section) => favoriteIdSet.has(section.id))
      : sections

    if (!normalized) return source

    return source.filter((section) =>
      section.title.toLowerCase().includes(normalized) ||
      (section.description ?? "").toLowerCase().includes(normalized),
    )
  }, [deferredSearch, favoriteIds, favoritesOnly, sections])

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const loadSections = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")
      const payload = await loadLibrarySectionsUseCase(deps, { rpgId })
      setSections(payload.sections)
    } catch (cause) {
      setLoadingError(
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao carregar secoes da biblioteca.",
      )
      setSections([])
    } finally {
      setLoading(false)
    }
  }, [deps, rpgId])

  useEffect(() => {
    if (rpgId) void loadSections()
  }, [loadSections, rpgId])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const rawFavorites = window.localStorage.getItem(favoriteStorageKey)
    if (!rawFavorites) {
      setFavoriteIds([])
      return
    }

    try {
      const parsedFavorites = JSON.parse(rawFavorites)
      setFavoriteIds(Array.isArray(parsedFavorites) ? parsedFavorites.filter(Boolean) : [])
    } catch {
      setFavoriteIds([])
    }
  }, [favoriteStorageKey])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteIds))
  }, [favoriteIds, favoriteStorageKey])

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return

    savingRef.current = true
    setSaving(true)
    setSubmitError("")
    const loadingToastId = toast.loading(editingId ? "Salvando secao..." : "Criando secao...")

    try {
      const payload = {
        title,
        description: description.trim() ? description.trim() : null,
        visibility,
      }
      const section = editingId
        ? await updateLibrarySectionUseCase(deps, {
            rpgId,
            sectionId: editingId,
            payload,
          })
        : await createLibrarySectionUseCase(deps, { rpgId, payload })

      if (editingId) {
        setSections((prev) => prev.map((item) => (item.id === section.id ? section : item)))
      } else {
        setSections((prev) => [section, ...prev])
      }
      toast.success(editingId ? "Secao atualizada com sucesso." : "Secao criada com sucesso.")
      closeModal()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro de conexao ao salvar secao."
      setSubmitError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setSaving(false)
      savingRef.current = false
    }
  }

  async function handleDelete(sectionId: string) {
    const confirmed = window.confirm("Tem certeza que deseja apagar esta sessao e seus livros?")
    if (!confirmed) return

    try {
      setDeletingId(sectionId)
      const loadingToastId = toast.loading("Apagando secao...")
      await deleteLibrarySectionUseCase(deps, { rpgId, sectionId })
      setSections((prev) => prev.filter((item) => item.id !== sectionId))
      if (editingId === sectionId) resetForm()
      dismissToast(loadingToastId)
      toast.success("Secao apagada com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro de conexao ao remover secao."
      setLoadingError(message)
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  function toggleFavorite(sectionId: string) {
    setFavoriteIds((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId],
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>{rpgTitle}</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Biblioteca</h1>
            <div className={styles.titleActions}>
              <button
                type="button"
                className={`${styles.iconButton} ${favoritesOnly ? styles.iconButtonActive : ""}`}
                onClick={() => setFavoritesOnly((current) => !current)}
                aria-label={favoritesOnly ? "Mostrar todas as secoes" : "Mostrar apenas favoritas"}
                title={favoritesOnly ? "Mostrar todas as secoes" : "Mostrar apenas favoritas"}
              >
                <Star size={18} fill={favoritesOnly ? "currentColor" : "none"} />
              </button>
              {!loading && !loadingError ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setIsModalOpen(true)}
                  aria-label="Adicionar secao"
                  title="Adicionar secao"
                >
                  <Plus size={16} />
                  <span>Criar</span>
                </button>
              ) : null}
            </div>
          </div>
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

      {isModalOpen ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "Editar secao" : "Criar secao"}
        >
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
              <label className={styles.field}>
                <span>Privacidade</span>
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as "private" | "public")}
                >
                  <option value="public">Publica</option>
                  <option value="private">Privada</option>
                </select>
              </label>
              {submitError ? <p className={styles.error}>{submitError}</p> : null}
              <div className={styles.headerActions}>
                <button type="submit" className={styles.primaryButton} disabled={saving}>
                  {saving ? "Salvando..." : editingId ? "Salvar edicao" : "Adicionar sessao"}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {loading ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>Carregando secoes...</p>
        </section>
      ) : null}
      {loadingError ? (
        <section className={styles.emptyState}>
          <p className={styles.error}>{loadingError}</p>
        </section>
      ) : null}
      {!loading && !loadingError && filteredSections.length === 0 ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>Nenhuma secao encontrada com os filtros atuais.</p>
        </section>
      ) : null}

      {!loading && !loadingError && filteredSections.length > 0 ? (
        <section className={styles.listPanel}>
          <div className={styles.grid}>
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
                <button
                  type="button"
                  className={`${styles.favoriteFab} ${favoriteIdSet.has(section.id) ? styles.favoriteFabActive : ""}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    toggleFavorite(section.id)
                  }}
                  aria-label={
                    favoriteIdSet.has(section.id)
                      ? `Remover ${section.title} dos favoritos`
                      : `Adicionar ${section.title} aos favoritos`
                  }
                  title={
                    favoriteIdSet.has(section.id)
                      ? `Remover ${section.title} dos favoritos`
                      : `Adicionar ${section.title} aos favoritos`
                  }
                >
                  <Star size={16} fill={favoriteIdSet.has(section.id) ? "currentColor" : "none"} />
                </button>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{section.title}</h2>
                </div>
                <p className={styles.cardDescription}>{section.description || "Sem descricao cadastrada."}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.cardActions}>
                    {section.canEdit ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={(event) => {
                          event.stopPropagation()
                          startEdit(section)
                        }}
                      >
                        Editar
                      </button>
                    ) : null}
                    {section.canDelete ? (
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
                  <span className={styles.countBadge}>{section.booksCount ?? 0} livro(s)</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
