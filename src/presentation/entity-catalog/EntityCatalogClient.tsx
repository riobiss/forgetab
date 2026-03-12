"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowUpDown, ChevronDown, ChevronUp, Filter, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { getCatalogMetaExcerpt } from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogItem, EntityCatalogSort, EntityCatalogTemplateRecord } from "@/application/entityCatalog/types"
import { useEntityCatalogState } from "@/presentation/entity-catalog/useEntityCatalogState"
import { useEntityCatalogActions } from "@/presentation/entity-catalog/useEntityCatalogActions"
import styles from "./EntityCatalogClient.module.css"

type Props = {
  rpgId: string
  entityType: CatalogEntityType
  title: string
  canManage: boolean
  items: EntityCatalogItem[]
}

type CategoryItemDraft = {
  identity: string
  label: string
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
  canManage,
  items,
}: Props) {
  const state = useEntityCatalogState(items)
  const actions = useEntityCatalogActions({ rpgId, entityType, canManage })
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
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false)
  const [manageCategoryName, setManageCategoryName] = useState("")
  const [manageCategoryDraft, setManageCategoryDraft] = useState("")
  const [manageCategoryItems, setManageCategoryItems] = useState<CategoryItemDraft[]>([])
  const [manageCategoryCollection, setManageCategoryCollection] = useState<EntityCatalogTemplateRecord[]>([])
  const [manageCategorySaving, setManageCategorySaving] = useState(false)
  const [manageCategoryError, setManageCategoryError] = useState("")

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
      const normalizedCategory =
        creatingCategory && newCategory.trim().length > 0
          ? newCategory.trim()
          : createCategory.trim() || "geral"

      await actions.createEntry({
        name: createName,
        category: normalizedCategory,
        description: createDescription,
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao criar."
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  function getTemplateCategory(item: EntityCatalogTemplateRecord) {
    return typeof item.category === "string" && item.category.trim().length > 0
      ? item.category.trim()
      : "geral"
  }

  function getTemplateIdentity(item: EntityCatalogTemplateRecord, index: number) {
    if (typeof item.id === "string" && item.id.trim().length > 0) return `id:${item.id}`
    if (typeof item.key === "string" && item.key.trim().length > 0) return `key:${item.key}`
    return `index:${index}`
  }

  async function openManageCategory(categoryName: string) {
    if (!canManage) return

    setManageCategoryError("")
    setManageCategorySaving(false)

    try {
      const collection = await actions.fetchCollection()
      const categoryItems = collection
        .map((item, index) => ({
          identity: getTemplateIdentity(item, index),
          label: typeof item.label === "string" ? item.label : "",
          category: getTemplateCategory(item),
        }))
        .filter((item) => item.category === categoryName)
        .map(({ identity, label }) => ({ identity, label }))

      setManageCategoryCollection(collection)
      setManageCategoryName(categoryName)
      setManageCategoryDraft(categoryName)
      setManageCategoryItems(categoryItems)
      setManageCategoryOpen(true)
    } catch (cause) {
      setManageCategoryError(cause instanceof Error ? cause.message : "Erro ao carregar categoria.")
      setManageCategoryOpen(true)
    }
  }

  async function handleSaveManagedCategory() {
    if (manageCategorySaving) return

    const nextCategoryName = manageCategoryDraft.trim() || manageCategoryName
    const itemDraftMap = new Map(manageCategoryItems.map((item) => [item.identity, item]))

    setManageCategorySaving(true)
    setManageCategoryError("")

    try {
      const nextCollection = manageCategoryCollection.reduce<EntityCatalogTemplateRecord[]>((acc, item, index) => {
        const identity = getTemplateIdentity(item, index)
        const category = getTemplateCategory(item)

        if (category !== manageCategoryName) {
          acc.push(item)
          return acc
        }

        const draft = itemDraftMap.get(identity)
        if (!draft) {
          return acc
        }

        acc.push({
          ...item,
          label: draft.label.trim() || item.label,
          category: nextCategoryName,
        })
        return acc
      }, [])

      await actions.saveCollection(nextCollection)
      setManageCategoryOpen(false)
    } catch (cause) {
      setManageCategoryError(cause instanceof Error ? cause.message : "Erro ao salvar categoria.")
    } finally {
      setManageCategorySaving(false)
    }
  }

  async function handleDeleteCategory() {
    if (manageCategorySaving) return
    setManageCategorySaving(true)
    setManageCategoryError("")

    try {
      const nextCollection = manageCategoryCollection.filter(
        (item) => getTemplateCategory(item) !== manageCategoryName,
      )

      await actions.saveCollection(nextCollection)
      setManageCategoryOpen(false)
    } catch (cause) {
      setManageCategoryError(cause instanceof Error ? cause.message : "Erro ao deletar categoria.")
    } finally {
      setManageCategorySaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{title}</h1>
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
                  </div>

                  <div className={styles.groupHeaderActions}>
                    <div className={styles.toolbar}>
                    <span className={styles.groupBadge}>{group.count}</span>
                    {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>

                    {canManage ? (
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={(event) => {
                          event.stopPropagation()
                          void openManageCategory(group.label)
                        }}
                        aria-label={`Gerenciar categoria ${group.label}`}
                        title="Gerenciar categoria"
                      >
                        <Pencil size={14} />
                      </button>
                    ) : null}
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

      {manageCategoryOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={() => setManageCategoryOpen(false)}>
          <section className={styles.manageModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Gerenciar categoria</h2>
              <button type="button" className={styles.drawerClose} onClick={() => setManageCategoryOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <label className={styles.field}>
              <span>Nome da categoria</span>
              <input
                value={manageCategoryDraft}
                onChange={(event) => setManageCategoryDraft(event.target.value)}
                placeholder="Nome da categoria"
              />
            </label>

            <div className={styles.manageItems}>
              {manageCategoryItems.map((item) => (
                <div key={item.identity} className={styles.manageItemRow}>
                  <input
                    value={item.label}
                    onChange={(event) =>
                      setManageCategoryItems((current) =>
                        current.map((entry) =>
                          entry.identity === item.identity ? { ...entry, label: event.target.value } : entry,
                        ),
                      )
                    }
                    placeholder="Nome do item"
                  />
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() =>
                      setManageCategoryItems((current) =>
                        current.filter((entry) => entry.identity !== item.identity),
                      )
                    }
                    aria-label={`Excluir ${item.label}`}
                    title="Excluir item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {manageCategoryError ? <p className={styles.description}>{manageCategoryError}</p> : null}

            <div className={styles.manageActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void handleSaveManagedCategory()}
                disabled={manageCategorySaving}
              >
                {manageCategorySaving ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                className={styles.dangerTextButton}
                onClick={() => void handleDeleteCategory()}
                disabled={manageCategorySaving}
              >
                Deletar categoria
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
