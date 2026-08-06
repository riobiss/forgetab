"use client"

import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogManagement } from "@/features/world/catalog/presentation/useEntityCatalogManagement"
import styles from "./EntityCatalogClient.module.css"

type Props = {
  entityType: CatalogEntityType
  categoryOptions: string[]
  state: EntityCatalogManagement["create"]
}

export default function CreateEntityCatalogModal({
  entityType,
  categoryOptions,
  state
}: Props) {
  if (!state.open) return null

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <section className={styles.modal}>
        <h2 className={styles.modalTitle}>
          Nova {entityType === "class" ? "classe" : "raca"}
        </h2>
        <label className={styles.field}>
          <span>Nome</span>
          <input
            value={state.name}
            onChange={(event) => state.setName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Categoria</span>
          {!state.creatingCategory ? (
            <div className={styles.inlineRow}>
              <select
                value={state.category}
                onChange={(event) => state.setCategory(event.target.value)}
              >
                <option value="geral">geral</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => state.setCreatingCategory(true)}
              >
                Nova categoria
              </button>
            </div>
          ) : (
            <div className={styles.inlineRow}>
              <input
                value={state.newCategory}
                onChange={(event) => state.setNewCategory(event.target.value)}
                placeholder="Nome da categoria"
              />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  state.setCreatingCategory(false)
                  state.setNewCategory("")
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
            className={styles.descriptionTextarea}
            rows={4}
            value={state.description}
            onChange={(event) => state.setDescription(event.target.value)}
          />
        </label>
        {state.error ? (
          <p className={styles.description}>{state.error}</p>
        ) : null}
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void state.submit()}
            disabled={state.submitting}
          >
            {state.submitting ? "Criando..." : "Criar"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => state.setOpen(false)}
            disabled={state.submitting}
          >
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
