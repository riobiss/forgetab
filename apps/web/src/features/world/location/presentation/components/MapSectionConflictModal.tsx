"use client"

import type { RefObject } from "react"
import styles from "../RpgMapPage.module.css"

type PendingSectionConflict = {
  linkedMarker: {
    id: string
  }
  fields: string[]
}

type Props = {
  isOpen: boolean
  modalRef: RefObject<HTMLElement | null>
  pendingSectionConflict: PendingSectionConflict | null
  saving: boolean
  onKeepMarker: () => void
  onKeepSection: () => void
  onGoToMap: (markerId: string) => void
  onClose: () => void
}

export function MapSectionConflictModal({
  isOpen,
  modalRef,
  pendingSectionConflict,
  saving,
  onKeepMarker,
  onKeepSection,
  onGoToMap,
  onClose,
}: Props) {
  if (!isOpen || !pendingSectionConflict) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Resolver conflito entre secao e marcador">
      <section ref={modalRef} className={`${styles.modal} ${styles.sectionConflictModal}`} tabIndex={-1}>
        <h2>Resolver conflito</h2>
        <p className={styles.feedback}>
          O marcador vinculado tem informacoes diferentes nos campos: {pendingSectionConflict.fields.join(", ")}.
        </p>
        <div className={styles.conflictActions}>
          <button type="button" className={styles.primaryButton} onClick={onKeepMarker} disabled={saving}>
            Manter marcador
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onKeepSection} disabled={saving}>
            Manter secao
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onGoToMap(pendingSectionConflict.linkedMarker.id)}
          >
            Ir ao mapa
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
