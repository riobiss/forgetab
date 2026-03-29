"use client"

import type { RefObject } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import type { MarkerGroup, MapMarkerItem } from "@/presentation/rpg-map/types/mapMarkers"
import styles from "../WorldMap.module.css"

type Props = {
  modalRef: RefObject<HTMLElement | null>
  isOpen: boolean
  group: MarkerGroup | null
  editingGroupName: string
  editingGroupColor: string
  markerColors: string[]
  canPublish: boolean
  onChangeGroupName: (value: string) => void
  onChangeGroupColor: (value: string) => void
  onAddMarkers: () => void
  onOpenMarker: (marker: MapMarkerItem) => void
  onEditMarker: (marker: MapMarkerItem) => void
  onDeleteMarker: (markerId: string) => void
  onSaveGroup: () => void
  onPublish: () => void
  onDeleteGroup: () => void
  onClose: () => void
}

export function MarkerGroupModal({
  modalRef,
  isOpen,
  group,
  editingGroupName,
  editingGroupColor,
  markerColors,
  canPublish,
  onChangeGroupName,
  onChangeGroupColor,
  onAddMarkers,
  onOpenMarker,
  onEditMarker,
  onDeleteMarker,
  onSaveGroup,
  onPublish,
  onDeleteGroup,
  onClose,
}: Props) {
  if (!isOpen || !group) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Lista de marcadores">
      <section ref={modalRef} className={`${styles.modal} ${styles.markerGroupModal}`} tabIndex={-1}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{group.name}</h2>
            <p className={styles.modalSubtle}>{group.markers.length} marcador(es)</p>
          </div>
          <div className={styles.modalHeaderActions}>
            {group.canEdit ? (
              <button type="button" className={styles.iconButton} onClick={onAddMarkers} aria-label="Adicionar marcadores">
                <Plus size={16} />
              </button>
            ) : null}
            <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>
        <label className={styles.field}>
          <span>Nome do grupo</span>
          <input
            value={editingGroupName}
            onChange={(event) => onChangeGroupName(event.target.value)}
            disabled={!group.canEdit}
          />
        </label>
        <div className={styles.field}>
          <span>Cor do grupo</span>
          <div className={styles.markerColorRow}>
            {markerColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChangeGroupColor(color)}
                className={`${styles.colorOption} ${editingGroupColor === color ? styles.colorOptionActive : ""}`}
                style={{ backgroundColor: color }}
                aria-label={`Cor ${color}`}
                disabled={!group.canEdit}
              />
            ))}
          </div>
        </div>
        <div className={styles.markerList}>
          {group.markers.length > 0 ? (
            group.markers.map((marker, index) => (
              <article key={marker.id} className={styles.markerListItem}>
                <button
                  type="button"
                  className={styles.markerListMain}
                  onClick={() => onOpenMarker(marker)}
                >
                  <span
                    className={styles.markerSwatch}
                    style={{ backgroundColor: marker.color || group.color }}
                  />
                  <div>
                    <strong>{marker.name}</strong>
                    <small>{marker.location || `Pino ${index + 1}`}</small>
                  </div>
                </button>
                <div className={styles.markerListActions}>
                  {marker.canEdit ? (
                    <button type="button" className={styles.iconButton} onClick={() => onEditMarker(marker)}>
                      <Pencil size={14} />
                    </button>
                  ) : null}
                  {marker.canDelete ? (
                    <button type="button" className={styles.iconButtonDanger} onClick={() => onDeleteMarker(marker.id)}>
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className={styles.modalSubtle}>Nenhum marcador neste grupo.</p>
          )}
        </div>
        <div className={styles.modalActions}>
          {group.canEdit ? (
            <button type="button" className={styles.primaryButton} onClick={onSaveGroup}>
              Salvar grupo
            </button>
          ) : null}
          {canPublish ? (
            <button type="button" className={styles.secondaryButton} onClick={onPublish}>
              Tornar publico
            </button>
          ) : null}
          {group.canDelete ? (
            <button type="button" className={styles.iconButtonDanger} onClick={onDeleteGroup}>
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )
}
