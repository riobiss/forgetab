"use client"

import { Trash2, X } from "lucide-react"
import type { EntityCatalogManagement } from "@/features/world/catalog/presentation/useEntityCatalogManagement"
import styles from "./EntityCatalogClient.module.css"

type Props = { state: EntityCatalogManagement["category"] }

export default function ManageEntityCatalogCategoryModal({ state }: Props) {
  if (!state.open) return null
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={() => state.setOpen(false)}>
      <section className={styles.manageModal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Gerenciar categoria</h2>
          <button type="button" className={styles.drawerClose} onClick={() => state.setOpen(false)} aria-label="Fechar gerenciamento de categoria"><X size={16} /></button>
        </div>
        <label className={styles.field}>
          <span>Nome da categoria</span>
          <input value={state.draft} onChange={(event) => state.setDraft(event.target.value)} placeholder="Nome da categoria" />
        </label>
        <div className={styles.manageItems}>
          {state.items.map((item) => (
            <div key={item.identity} className={styles.manageItemRow}>
              <input value={item.label} onChange={(event) => state.setItems((current) => current.map((entry) => entry.identity === item.identity ? { ...entry, label: event.target.value } : entry))} placeholder="Nome do item" />
              <button type="button" className={styles.dangerButton} onClick={() => state.setItems((current) => current.filter((entry) => entry.identity !== item.identity))} aria-label={`Excluir ${item.label}`} title="Excluir item"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        {state.error ? <p className={styles.description}>{state.error}</p> : null}
        <div className={styles.manageActions}>
          <button type="button" className={styles.primaryButton} onClick={() => void state.save()} disabled={state.submitting}>{state.submitting ? "Salvando..." : "Salvar"}</button>
          <button type="button" className={styles.dangerTextButton} onClick={() => void state.delete()} disabled={state.submitting}>Deletar categoria</button>
        </div>
      </section>
    </div>
  )
}
