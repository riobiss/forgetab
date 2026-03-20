"use client"

import type { RefObject } from "react"
import type { RpgMapDto } from "@/application/rpgMap/types"
import styles from "../RpgMapPage.module.css"

type MapFormState = {
  title: string
  description: string
  type: string
}

type Props = {
  isOpen: boolean
  modalRef: RefObject<HTMLElement | null>
  editingMap: RpgMapDto | null
  mapForm: MapFormState
  mapFormError: string
  saving: boolean
  onChangeForm: (updater: (current: MapFormState) => MapFormState) => void
  onSave: () => void
  onClose: () => void
}

export function MapFormModal({
  isOpen,
  modalRef,
  editingMap,
  mapForm,
  mapFormError,
  saving,
  onChangeForm,
  onSave,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Salvar mapa">
      <section ref={modalRef} className={styles.modal} tabIndex={-1}>
        <h2>{editingMap ? "Editar mapa" : "Criar mapa"}</h2>
        <label className={styles.field}>
          <span>Nome</span>
          <input value={mapForm.title} onChange={(event) => onChangeForm((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label className={styles.field}>
          <span>Descricao</span>
          <textarea
            rows={3}
            value={mapForm.description}
            onChange={(event) => onChangeForm((current) => ({ ...current, description: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span>Tipo</span>
          <input
            value={mapForm.type}
            onChange={(event) => onChangeForm((current) => ({ ...current, type: event.target.value }))}
            placeholder="planet, kingdom, station..."
          />
        </label>
        {mapFormError ? <p className={styles.error}>{mapFormError}</p> : null}
        <div className={styles.modalActions}>
          <button type="button" className={styles.primaryButton} onClick={onSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
