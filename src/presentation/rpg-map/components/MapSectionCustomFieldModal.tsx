"use client"

import type { RefObject } from "react"
import { TypedCustomFieldEditor } from "@/components/custom-fields/TypedCustomFieldEditor"
import type { CustomFieldDraftState } from "@/presentation/rpg-map/hooks/useRpgMapSectionModalState"
import styles from "../RpgMapPage.module.css"

type Props = {
  isOpen: boolean
  modalRef: RefObject<HTMLElement | null>
  customFieldKeyInputRef: RefObject<HTMLInputElement | null>
  draft: CustomFieldDraftState
  error: string
  onChangeDraft: (updater: (current: CustomFieldDraftState) => CustomFieldDraftState) => void
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
        <TypedCustomFieldEditor
          field={draft}
          keyInputRef={customFieldKeyInputRef}
          layout="stacked"
          onChange={onChangeDraft}
        />
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
