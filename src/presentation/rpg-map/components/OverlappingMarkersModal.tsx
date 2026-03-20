"use client"

import type { RefObject } from "react"
import { X } from "lucide-react"
import type { MapMarkerItem } from "@/presentation/rpg-map/types/mapMarkers"
import styles from "../WorldMap.module.css"

type OverlappingMarkerOption = {
  marker: MapMarkerItem
  groupColor: string
}

type Props = {
  modalRef: RefObject<HTMLDivElement | null>
  markers: OverlappingMarkerOption[]
  onSelect: (option: OverlappingMarkerOption) => void
  onClose: () => void
}

export function OverlappingMarkersModal({ modalRef, markers, onSelect, onClose }: Props) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Selecionar marcador">
      <section ref={modalRef} className={styles.modal} tabIndex={-1}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Selecionar marcador</h2>
            <p className={styles.modalSubtle}>Existem varios marcadores nessa regiao. Escolha qual deseja visualizar.</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar selecao de marcador">
            <X size={16} />
          </button>
        </div>
        <div className={styles.markerList}>
          {markers.map((option, index) => (
            <button
              key={option.marker.id}
              type="button"
              className={styles.overlappingMarkerButton}
              onClick={() => onSelect(option)}
            >
              <div className={styles.markerListMain}>
                <span className={styles.markerSwatch} style={{ backgroundColor: option.groupColor }} />
                <div>
                  <strong>{option.marker.name}</strong>
                  <small>{option.marker.location || `Pino ${index + 1}`}</small>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
