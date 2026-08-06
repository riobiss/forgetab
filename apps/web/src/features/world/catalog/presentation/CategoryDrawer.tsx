"use client"

import { X } from "lucide-react"
import styles from "./EntityCatalogClient.module.css"

type Props = {
  open: boolean
  categoryOptions: string[]
  selectedCategory: string
  onSelectCategory(category: string): void
  onOpenChange(open: boolean): void
}

export default function CategoryDrawer({
  open,
  categoryOptions,
  selectedCategory,
  onSelectCategory,
  onOpenChange
}: Props) {
  if (!open) return null
  const selectAndClose = (category: string) => {
    onSelectCategory(category)
    onOpenChange(false)
  }

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        aria-label="Fechar categorias"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Categorias"
      >
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Categorias</h3>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => onOpenChange(false)}
            aria-label="Fechar categorias"
          >
            <X size={16} />
          </button>
        </div>
        <div className={styles.drawerTagsSection}>
          <div className={styles.chipsRow}>
            {["all", ...categoryOptions].map((option) => (
              <button
                key={option}
                type="button"
                className={
                  selectedCategory === option
                    ? `${styles.chipButton} ${styles.chipButtonActive}`
                    : styles.chipButton
                }
                onClick={() => selectAndClose(option)}
              >
                {option === "all" ? "Todas" : option}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={styles.drawerClear}
          onClick={() => selectAndClose("all")}
        >
          Limpar filtro
        </button>
      </aside>
    </>
  )
}
