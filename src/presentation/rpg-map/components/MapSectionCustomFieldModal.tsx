"use client"

import type { RefObject } from "react"
import styles from "../RpgMapPage.module.css"

type CustomFieldDraft = {
  key: string
  value: string
}

type Props = {
  isOpen: boolean
  modalRef: RefObject<HTMLElement | null>
  customFieldKeyInputRef: RefObject<HTMLInputElement | null>
  draft: CustomFieldDraft
  error: string
  onChangeDraft: (updater: (current: CustomFieldDraft) => CustomFieldDraft) => void
  onSave: () => void
  onClose: () => void
}

export function MapSectionCustomFieldModal({
  isOpen,
  modalRef,
  customFieldKeyInputRef,
  draft,
  error,
  onChangeDraft,
  onSave,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Adicionar campo customizado">
      <section ref={modalRef} className={`${styles.modal} ${styles.customFieldModal}`} tabIndex={-1}>
        <h2>Novo campo</h2>
        <label className={styles.field}>
          <span>Chave</span>
          <input
            ref={customFieldKeyInputRef}
            value={draft.key}
            onChange={(event) => onChangeDraft((current) => ({ ...current, key: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span>Valor</span>
          <input
            value={draft.value}
            onChange={(event) => onChangeDraft((current) => ({ ...current, value: event.target.value }))}
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.modalActions}>
          <button type="button" className={styles.primaryButton} onClick={onSave}>
            Salvar
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
