"use client"

import { useState } from "react"
import { ArrowUpDown, Filter, Plus, Search } from "lucide-react"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogItem } from "@/features/world/catalog/application/types"
import EntityCatalogGroups from "@/features/world/catalog/presentation/EntityCatalogGroups"
import EntityCatalogOverlays from "@/features/world/catalog/presentation/EntityCatalogOverlays"
import { useEntityCatalogManagement } from "@/features/world/catalog/presentation/useEntityCatalogManagement"
import { useEntityCatalogState } from "@/features/world/catalog/presentation/useEntityCatalogState"
import styles from "./EntityCatalogClient.module.css"

type Props = {
  rpgId: string
  rpgTitle: string
  entityType: CatalogEntityType
  title: string
  canManage: boolean
  items: EntityCatalogItem[]
}

export default function EntityCatalogClient({
  rpgId,
  rpgTitle,
  entityType,
  title,
  canManage,
  items,
}: Props) {
  const state = useEntityCatalogState(items)
  const management = useEntityCatalogManagement({
    rpgId,
    entityType,
    canManage,
  })
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>{rpgTitle}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={
              state.category !== "all"
                ? `${styles.iconButton} ${styles.iconButtonActive}`
                : styles.iconButton
            }
            onClick={() => setCategoryDrawerOpen(true)}
            aria-label="Filtrar por categoria"
            title="Categorias"
          >
            <Filter size={16} />
          </button>

          <button
            type="button"
            className={
              sortModalOpen || state.sort !== "name-asc"
                ? `${styles.iconButton} ${styles.iconButtonActive}`
                : styles.iconButton
            }
            onClick={() => setSortModalOpen(true)}
            aria-label="Ordenar itens"
            title="Ordenacao"
          >
            <ArrowUpDown size={16} />
          </button>

          {canManage ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={management.create.openModal}
            >
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

      <EntityCatalogGroups
        groups={state.groups}
        collapsedGroups={state.collapsedGroups}
        canManage={canManage}
        onToggleGroup={state.toggleGroup}
        onManageCategory={(category) =>
          void management.category.openModal(category)
        }
      />

      <EntityCatalogOverlays
        entityType={entityType}
        categoryOptions={state.categoryOptions}
        selectedCategory={state.category}
        onSelectCategory={state.setCategory}
        categoryDrawerOpen={categoryDrawerOpen}
        onCategoryDrawerChange={setCategoryDrawerOpen}
        selectedSort={state.sort}
        onSelectSort={state.setSort}
        sortModalOpen={sortModalOpen}
        onSortModalChange={setSortModalOpen}
        management={management}
      />
    </div>
  )
}
