"use client"

import type { RefObject } from "react"
import { X } from "lucide-react"
import type { PendingMarker } from "@/presentation/rpg-map/types/mapMarkers"
import styles from "../WorldMap.module.css"

type Props = {
  modalRef: RefObject<HTMLElement | null>
  isOpen: boolean
  markerGroupName: string
  markerGroupColor: string
  markerColors: string[]
  pendingMarkers: PendingMarker[]
  setMarkerGroupName: (value: string) => void
  setMarkerGroupColor: (value: string) => void
  setPendingMarkers: (updater: (current: PendingMarker[]) => PendingMarker[]) => void
  onSave: () => void
  onClose: () => void
}

export function MarkerFinalizeModal({
  modalRef,
  isOpen,
  markerGroupName,
  markerGroupColor,
  markerColors,
  pendingMarkers,
  setMarkerGroupName,
  setMarkerGroupColor,
  setPendingMarkers,
  onSave,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Concluir marcadores">
      <section ref={modalRef} className={styles.modal} tabIndex={-1}>
        <div className={styles.modalHeader}>
          <h2>Novo grupo de marcadores</h2>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        <label className={styles.field}>
          <span>Nome</span>
          <input
            value={markerGroupName}
            onChange={(event) => setMarkerGroupName(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            data-lpignore="true"
          />
        </label>
        <div className={styles.field}>
          <span>Cor</span>
          <div className={styles.markerColorRow}>
            {markerColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setMarkerGroupColor(color)}
                className={`${styles.colorOption} ${markerGroupColor === color ? styles.colorOptionActive : ""}`}
                style={{ backgroundColor: color }}
                aria-label={`Cor ${color}`}
              />
            ))}
          </div>
        </div>
        <div className={styles.markerDraftList}>
          {pendingMarkers.map((marker, index) => (
            <div key={marker.id} className={styles.markerDraftItem}>
              <div className={styles.markerDraftHeader}>
                <span className={styles.markerNumber}>{index + 1}</span>
                <input
                  value={marker.name}
                  placeholder="Nome do marcador"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  inputMode="text"
                  data-lpignore="true"
                  onChange={(event) =>
                    setPendingMarkers((current) =>
                      current.map((item) => (item.id === marker.id ? { ...item, name: event.target.value } : item)),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <p className={styles.modalSubtle}>
          Depois de salvar, use <strong>Editar</strong> para ajustar descricao, imagem, tamanho, estilo e outras
          informacoes de cada marcador.
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.primaryButton} onClick={onSave} disabled={pendingMarkers.length === 0}>
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
