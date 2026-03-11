"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowUpDown, ChevronDown, ChevronUp, Filter, Plus, Search, X } from "lucide-react"
import { createRichTextDocumentFromText } from "@/domain/entityCatalog/catalogMeta"
import slugify from "@/utils/slugify"
import { getCatalogMetaExcerpt } from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogItem, EntityCatalogSort } from "@/application/entityCatalog/types"
import { useEntityCatalogState } from "@/presentation/entity-catalog/useEntityCatalogState"
import styles from "./EntityCatalogClient.module.css"

type Props = {
  rpgId: string
  entityType: CatalogEntityType
  title: string
  subtitle: string
  canManage: boolean
  items: EntityCatalogItem[]
}

const SORT_OPTIONS: Array<{ value: EntityCatalogSort; label: string }> = [
  { value: "name-asc", label: "Nome A-Z" },
  { value: "name-desc", label: "Nome Z-A" },
  { value: "category-asc", label: "Categoria" },
]

export default function EntityCatalogClient({
  rpgId,
  entityType,
  title,
  subtitle,
  canManage,
  items,
}: Props) {
  const router = useRouter()
  const state = useEntityCatalogState(items)
  const totalCount = items.length
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createCategory, setCreateCategory] = useState("geral")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)

  async function openCreateModal() {
    if (!canManage) return

    setCreateError("")
    setCreateName("")
    setCreateCategory("geral")
    setCreateDescription("")
    setCreatingCategory(false)
    setNewCategory("")
    setCreateOpen(true)
  }

  async function handleCreate() {
    if (!canManage || creating) return
    setCreating(true)
    setCreateError("")

    try {
      const endpoint = entityType === "class" ? "classes" : "races"
      const getResponse = await fetch(`/api/rpg/${rpgId}/${endpoint}`)
      const currentPayload = (await getResponse.json()) as {
        classes?: Array<Record<string, unknown>>
        races?: Array<Record<string, unknown>>
        message?: string
      }

      if (!getResponse.ok) {
        throw new Error(currentPayload.message ?? "Nao foi possivel carregar a lista atual.")
      }

      const collection = entityType === "class" ? currentPayload.classes ?? [] : currentPayload.races ?? []
      const normalizedCategory =
        creatingCategory && newCategory.trim().length > 0
          ? newCategory.trim()
          : createCategory.trim() || "geral"
      const nextEntry = {
        label: createName.trim(),
        category: normalizedCategory,
        attributeBonuses: {},
        skillBonuses: {},
        catalogMeta: {
          shortDescription: createDescription.trim() || null,
          richText: {
            description: createRichTextDocumentFromText(createDescription),
          },
        },
      }

      const putResponse = await fetch(`/api/rpg/${rpgId}/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          entityType === "class"
            ? { classes: [...collection, nextEntry] }
            : { races: [...collection, nextEntry] },
        ),
      })
      const putPayload = (await putResponse.json()) as { message?: string }
      if (!putResponse.ok) {
        throw new Error(putPayload.message ?? "Nao foi possivel criar.")
      }

      const refreshResponse = await fetch(`/api/rpg/${rpgId}/${endpoint}`)
      const refreshPayload = (await refreshResponse.json()) as {
        classes?: Array<{ id: string; key: string; label: string }>
        races?: Array<{ key: string; label: string }>
        message?: string
      }
      if (!refreshResponse.ok) {
        throw new Error(refreshPayload.message ?? "Nao foi possivel localizar o item criado.")
      }

      const expectedKey = slugify(createName.trim())
      if (entityType === "class") {
        const created = (refreshPayload.classes ?? []).find((item) => item.key === expectedKey)
        if (!created) throw new Error("Classe criada, mas nao localizada.")
        router.push(`/rpg/${rpgId}/classes/${created.id}`)
      } else {
        const created = (refreshPayload.races ?? []).find((item) => item.key === expectedKey)
        if (!created) throw new Error("Raca criada, mas nao localizada.")
        router.push(`/rpg/${rpgId}/races/${created.key}`)
      }
      router.refresh()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao criar."
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>{entityType === "class" ? "Classes" : "Racas"}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={state.category !== "all" ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
            onClick={() => setCategoryDrawerOpen(true)}
            aria-label="Filtrar por categoria"
            title="Categorias"
          >
            <Filter size={16} />
          </button>

          <button
            type="button"
            className={sortModalOpen || state.sort !== "name-asc" ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
            onClick={() => setSortModalOpen(true)}
            aria-label="Ordenar itens"
            title="Ordenacao"
          >
            <ArrowUpDown size={16} />
          </button>

          {canManage ? (
            <button type="button" className={styles.primaryButton} onClick={() => void openCreateModal()}>
              <Plus size={16} />
              <span>Criar {entityType === "class" ? "classe" : "raca"}</span>
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
                value={state.search}
                onChange={(event) => state.setSearch(event.target.value)}
                placeholder="Buscar..."
              />
            </div>
          </label>
        </div>

        <div className={styles.controlsFooter}>
          <div className={styles.resultMeta}>
            <span className={styles.statusDot} />
            <span>
              {state.visibleCount} de {totalCount} itens
            </span>
            {state.isPending ? <span>Atualizando filtros...</span> : null}
          </div>

        </div>
      </section>

      {state.groups.length === 0 ? (
        <section className={styles.emptyState}>
          Nenhum item encontrado com os filtros atuais.
        </section>
      ) : (
        <section className={styles.groups}>
          {state.groups.map((group) => {
            const collapsed = state.collapsedGroups[group.key]
            return (
              <article key={group.key} className={styles.group}>
                <button
                  type="button"
                  className={styles.groupHeader}
                  onClick={() => state.toggleGroup(group.key)}
                >
                  <div className={styles.groupHeaderInfo}>
                    <h2 className={styles.groupTitle}>{group.label}</h2>
                    <p className={styles.groupSubtitle}>Itens agrupados por categoria</p>
                  </div>

                  <div className={styles.toolbar}>
                    <span className={styles.groupBadge}>{group.count}</span>
                    {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </div>
                </button>

                {!collapsed ? (
                  <div className={styles.groupContent}>
                    <div className={styles.grid}>
                    {group.items.map((item) => {
                      const excerpt = getCatalogMetaExcerpt(item.meta)
                      return (
                        <Link key={item.id} href={item.href} className={styles.card}>
                          <div className={styles.cardBody}>
                            <div className={styles.cardHeader}>
                              <div className={styles.cardHeaderTop}>
                                  <h3 className={styles.cardTitle}>{item.name}</h3>
                                  <span className={styles.cardCategory}>{item.category}</span>
                                </div>
                              </div>

                            {excerpt ? <p className={styles.description}>{excerpt}</p> : null}
                          </div>
                        </Link>
                      )
                    })}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>
      )}

      {createOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <section className={styles.modal}>
            <h2 className={styles.modalTitle}>Nova {entityType === "class" ? "classe" : "raca"}</h2>

            <label className={styles.field}>
              <span>Nome</span>
              <input value={createName} onChange={(event) => setCreateName(event.target.value)} />
            </label>

            <label className={styles.field}>
              <span>Categoria</span>
              {!creatingCategory ? (
                <div className={styles.inlineRow}>
                  <select value={createCategory} onChange={(event) => setCreateCategory(event.target.value)}>
                    <option value="geral">geral</option>
                    {state.categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setCreatingCategory(true)}
                  >
                    Nova categoria
                  </button>
                </div>
              ) : (
                <div className={styles.inlineRow}>
                  <input
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                    placeholder="Nome da categoria"
                  />
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setCreatingCategory(false)
                      setNewCategory("")
                    }}
                  >
                    Usar existente
                  </button>
                </div>
              )}
            </label>

            <label className={styles.field}>
              <span>Descricao basica</span>
              <textarea
                rows={4}
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
              />
            </label>

            {createError ? <p className={styles.description}>{createError}</p> : null}

            <div className={styles.toolbar}>
              <button type="button" className={styles.primaryButton} onClick={() => void handleCreate()} disabled={creating}>
                {creating ? "Criando..." : "Criar"}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {categoryDrawerOpen ? (
        <>
          <button
            type="button"
            className={styles.drawerBackdrop}
            aria-label="Fechar categorias"
            onClick={() => setCategoryDrawerOpen(false)}
          />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Categorias">
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Categorias</h3>
              <button type="button" className={styles.drawerClose} onClick={() => setCategoryDrawerOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.drawerTagsSection}>
              <div className={styles.chipsRow}>
                <button
                  type="button"
                  className={state.category === "all" ? `${styles.chipButton} ${styles.chipButtonActive}` : styles.chipButton}
                  onClick={() => {
                    state.setCategory("all")
                    setCategoryDrawerOpen(false)
                  }}
                >
                  Todas
                </button>
                {state.categoryOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={state.category === option ? `${styles.chipButton} ${styles.chipButtonActive}` : styles.chipButton}
                    onClick={() => {
                      state.setCategory(option)
                      setCategoryDrawerOpen(false)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={styles.drawerClear}
              onClick={() => {
                state.setCategory("all")
                setCategoryDrawerOpen(false)
              }}
            >
              Limpar filtro
            </button>
          </aside>
        </>
      ) : null}

      {sortModalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={() => setSortModalOpen(false)}>
          <section className={styles.sortModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Ordenacao</h2>
              <button type="button" className={styles.drawerClose} onClick={() => setSortModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.sortOptions}>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={state.sort === option.value ? `${styles.sortOption} ${styles.sortOptionActive}` : styles.sortOption}
                  onClick={() => {
                    state.setSort(option.value)
                    setSortModalOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
