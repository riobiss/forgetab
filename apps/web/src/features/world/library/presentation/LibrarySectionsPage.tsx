"use client"

import { useRouter } from "next/navigation"
import { Plus, Search, Star } from "lucide-react"
import type { LibraryDependencies } from "@/features/world/library/application/contracts/LibraryDependencies"
import { LibrarySectionCard } from "./LibrarySectionCard"
import { LibrarySectionModal } from "./LibrarySectionModal"
import { useLibrarySectionsController } from "./useLibrarySectionsController"
import styles from "./LibrarySectionsPage.module.css"

type Props = {
  rpgId: string
  rpgTitle: string
  deps: LibraryDependencies
}

export default function LibrarySectionsPage({ rpgId, rpgTitle, deps }: Props) {
  const router = useRouter()
  const controller = useLibrarySectionsController({ rpgId, deps })

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
                className={`${styles.iconButton} ${controller.favoritesOnly ? styles.iconButtonActive : ""}`}
                onClick={() =>
                  controller.setFavoritesOnly((current) => !current)
                }
                aria-label={
                  controller.favoritesOnly
                    ? "Mostrar todas as secoes"
                    : "Mostrar apenas favoritas"
                }
              >
                <Star
                  size={18}
                  fill={controller.favoritesOnly ? "currentColor" : "none"}
                />
              </button>
              {!controller.loading && !controller.loadingError ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={controller.openCreateModal}
                  aria-label="Adicionar secao"
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
                value={controller.search}
                onChange={(event) => controller.setSearch(event.target.value)}
                placeholder="Buscar..."
              />
            </div>
          </label>
        </div>
      </section>

      {controller.modal.isOpen ? (
        <LibrarySectionModal modal={controller.modal} />
      ) : null}
      {controller.loading ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>Carregando secoes...</p>
        </section>
      ) : null}
      {controller.loadingError ? (
        <section className={styles.emptyState}>
          <p className={styles.error}>{controller.loadingError}</p>
        </section>
      ) : null}
      {!controller.loading &&
      !controller.loadingError &&
      controller.filteredSections.length === 0 ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>
            Nenhuma secao encontrada com os filtros atuais.
          </p>
        </section>
      ) : null}

      {!controller.loading &&
      !controller.loadingError &&
      controller.filteredSections.length > 0 ? (
        <section className={styles.listPanel}>
          <div className={styles.grid}>
            {controller.filteredSections.map((section) => (
              <LibrarySectionCard
                key={section.id}
                section={section}
                favorite={controller.favoriteIdSet.has(section.id)}
                deleting={controller.deletingId === section.id}
                onOpen={() =>
                  router.push(`/rpg/${rpgId}/library/${section.id}`)
                }
                onEdit={() => controller.startEdit(section)}
                onDelete={() => void controller.deleteSection(section.id)}
                onToggleFavorite={() => controller.toggleFavorite(section.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
