"use client"

import Link from "next/link"
import { ChevronDown, ChevronUp, LayoutGrid, List, Plus, Search, SlidersHorizontal } from "lucide-react"
import { getCatalogMetaExcerpt } from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogItem, EntityCatalogSort } from "@/application/entityCatalog/types"
import { useEntityCatalogState } from "@/presentation/entity-catalog/useEntityCatalogState"
import styles from "./EntityCatalogClient.module.css"

type Props = {
  entityType: CatalogEntityType
  title: string
  subtitle: string
  createHref?: string
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
  entityType,
  title,
  subtitle,
  createHref,
  items,
}: Props) {
  const state = useEntityCatalogState(items)
  const totalCount = items.length

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroRow}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Catalogo administrativo</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          <div className={styles.heroActions}>
            {createHref ? (
              <Link href={createHref} className={styles.primaryButton}>
                <Plus size={16} />
                <span>Criar {entityType === "class" ? "classe" : "raca"}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.controlsGrid}>
          <label className={styles.field}>
            <span>Busca</span>
            <input
              type="search"
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
              placeholder="Nome, slug, categoria ou descricao curta"
            />
          </label>

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
                    ? `${styles.viewButton} ${styles.viewButtonActive}`
                    : styles.viewButton
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
                    ? `${styles.viewButton} ${styles.viewButtonActive}`
                    : styles.viewButton
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
                                Ver detalhes
                              </Link>
                              {item.editHref ? (
                                <Link href={item.editHref} className={styles.secondaryButton}>
                                  Editar
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
    </div>
  )
}

