"use client"

import { Plus, Search } from "lucide-react"
import type { LibraryDependencies } from "@/features/world/library/application/contracts/LibraryDependencies"
import { LibraryBookCreateModal } from "./LibraryBookCreateModal"
import { LibraryBookEditModal } from "./LibraryBookEditModal"
import { useLibrarySectionBooksController } from "./useLibrarySectionBooksController"
import styles from "./LibrarySectionBooksPage.module.css"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
}

type Props = {
  rpgId: string
  sectionId: string
  deps: LibraryDependencies
}

export default function LibrarySectionBooksPage({
  rpgId,
  sectionId,
  deps
}: Props) {
  const controller = useLibrarySectionBooksController({
    rpgId,
    sectionId,
    deps
  })

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>Biblioteca</p>
          <h1 className={styles.title}>
            {controller.section?.title ?? "Biblioteca"}
          </h1>
        </div>
        <div className={styles.headerActions}>
          {controller.canCreate ? (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={controller.openCreateModal}
            >
              <Plus size={16} />
              <span>Novo livro</span>
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
                value={controller.search}
                onChange={(event) => controller.setSearch(event.target.value)}
                placeholder="Buscar..."
              />
            </div>
          </label>
        </div>
      </section>

      {controller.loading ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>Carregando livros...</p>
        </section>
      ) : null}
      {controller.loadingError ? (
        <section className={styles.emptyState}>
          <p className={styles.error}>{controller.loadingError}</p>
        </section>
      ) : null}
      {!controller.loading &&
      !controller.loadingError &&
      controller.filteredBooks.length === 0 ? (
        <section className={styles.emptyState}>
          <p className={styles.feedback}>
            Nenhum livro encontrado com os filtros atuais.
          </p>
        </section>
      ) : null}

      {!controller.loading &&
      !controller.loadingError &&
      controller.filteredBooks.length > 0 ? (
        <section className={styles.listPanel}>
          <div className={styles.grid}>
            {controller.filteredBooks.map((book) => (
              <article
                key={book.id}
                className={styles.bookCard}
                role="button"
                tabIndex={0}
                onClick={() => controller.openBook(book.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    controller.openBook(book.id)
                  }
                }}
              >
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{book.title}</h2>
                </div>
                <p className={styles.bookDescription}>
                  {book.description || "Sem descricao cadastrada."}
                </p>
                <div className={styles.metaList}>
                  <p className={styles.bookMeta}>
                    Criado: {formatDate(book.createdAt)}
                  </p>
                  <p className={styles.bookMeta}>
                    Atualizado: {formatDate(book.updatedAt)}
                  </p>
                </div>
                {book.canEdit ? (
                  <div className={styles.cardFooter}>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={(event) => {
                          event.stopPropagation()
                          controller.openEditModal(book)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={(event) => {
                          event.stopPropagation()
                          void controller.deleteBook(book.id)
                        }}
                        disabled={controller.deletingId === book.id}
                      >
                        {controller.deletingId === book.id
                          ? "Apagando..."
                          : "Apagar"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <LibraryBookEditModal {...controller.editModal} />
      <LibraryBookCreateModal {...controller.createModal} />
    </main>
  )
}
