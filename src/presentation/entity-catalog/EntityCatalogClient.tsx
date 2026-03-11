"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronUp, LayoutGrid, List, Plus, Search, SlidersHorizontal } from "lucide-react"
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
  { value: "slug-asc", label: "Slug A-Z" },
  { value: "slug-desc", label: "Slug Z-A" },
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
  const [createDescription, setCreateDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

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
      const nextEntry = {
        label: createName.trim(),
        category: createCategory,
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
      setCreateError(cause instanceof Error ? cause.message : "Erro ao criar.")
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
          {canManage ? (
            <button type="button" className={styles.primaryButton} onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              <span>Criar {entityType === "class" ? "classe" : "raca"}</span>
            </button>
          ) : null}
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.searchRow}>
          <label className={styles.field}>
            <span>Busca</span>
            <div className={styles.searchInputWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="search"
                value={state.search}
                onChange={(event) => state.setSearch(event.target.value)}
                placeholder="Nome, slug, categoria ou descricao curta"
              />
            </div>
          </label>
        </div>

        <div className={styles.filtersRow}>
          <label className={styles.field}>
            <span>Categoria</span>
            <select
              value={state.category}
              onChange={(event) => state.setCategory(event.target.value)}
            >
              <option value="all">Todas</option>
              {state.categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Ordenacao</span>
            <select
              value={state.sort}
              onChange={(event) => state.setSort(event.target.value as EntityCatalogSort)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.field}>
            <span>Visualizacao</span>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={
                  state.view === "grouped"
                    ? `${styles.viewToggle} ${styles.viewToggleActive}`
                    : styles.viewToggle
                }
                onClick={() => state.setView("grouped")}
              >
                <LayoutGrid size={16} />
                <span>Grupos</span>
              </button>
              <button
                type="button"
                className={
                  state.view === "list"
                    ? `${styles.viewToggle} ${styles.viewToggleActive}`
                    : styles.viewToggle
                }
                onClick={() => state.setView("list")}
              >
                <List size={16} />
                <span>Lista</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.controlsFooter}>
          <div className={styles.resultMeta}>
            <span className={styles.statusDot} />
            <span>
              {state.visibleCount} de {totalCount} itens
            </span>
            {state.isPending ? <span>Atualizando filtros...</span> : null}
          </div>

          <div className={styles.toolbar}>
            <button type="button" className={styles.groupActionButton} onClick={state.expandAllGroups}>
              <SlidersHorizontal size={16} />
              <span>Expandir grupos</span>
            </button>
            <button type="button" className={styles.groupActionButton} onClick={state.collapseAllGroups}>
              <Search size={16} />
              <span>Recolher grupos</span>
            </button>
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
                    <div className={state.view === "grouped" ? styles.grid : styles.list}>
                      {group.items.map((item) => {
                        const excerpt = getCatalogMetaExcerpt(item.meta)
                        return (
                          <article key={item.id} className={styles.card}>
                            <div className={styles.cardBody}>
                              <div className={styles.cardHeader}>
                                <div className={styles.cardHeaderTop}>
                                  <h3 className={styles.cardTitle}>{item.name}</h3>
                                  <span className={styles.cardCategory}>{item.category}</span>
                                </div>
                                <p className={styles.slugLine}>slug: {item.slug}</p>
                              </div>

                              {excerpt ? <p className={styles.description}>{excerpt}</p> : null}
                            </div>

                            <div className={styles.cardActions}>
                              <Link href={item.href} className={styles.actionLink}>
                                Ver
                              </Link>
                              {canManage ? (
                                <Link href={item.href} className={styles.secondaryButton}>
                                  Abrir
                                </Link>
                              ) : null}
                            </div>
                          </article>
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
              <select value={createCategory} onChange={(event) => setCreateCategory(event.target.value)}>
                <option value="geral">geral</option>
                {state.categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
    </div>
  )
}
