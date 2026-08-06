"use client"

import { X } from "lucide-react"
import type { EntityCatalogSort } from "@/features/world/catalog/application/types"
import styles from "./EntityCatalogClient.module.css"

const OPTIONS: Array<{ value: EntityCatalogSort; label: string }> = [
  { value: "name-asc", label: "Nome A-Z" },
  { value: "name-desc", label: "Nome Z-A" },
  { value: "category-asc", label: "Categoria" }
]

type Props = {
  open: boolean
  selectedSort: EntityCatalogSort
  onSelectSort(sort: EntityCatalogSort): void
  onOpenChange(open: boolean): void
}

export default function EntityCatalogSortModal({
  open,
  selectedSort,
  onSelectSort,
  onOpenChange
}: Props) {
  if (!open) return null
  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange(false)}
    >
      <section
        className={styles.sortModal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Ordenacao</h2>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => onOpenChange(false)}
            aria-label="Fechar ordenacao"
          >
            <X size={16} />
          </button>
        </div>
        <div className={styles.sortOptions}>
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                selectedSort === option.value
                  ? `${styles.sortOption} ${styles.sortOptionActive}`
                  : styles.sortOption
              }
              onClick={() => {
                onSelectSort(option.value)
                onOpenChange(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
