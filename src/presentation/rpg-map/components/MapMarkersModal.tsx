"use client"

import type { RefObject } from "react"
import { Pencil, Plus, X } from "lucide-react"
import type { MarkerGroup } from "@/presentation/rpg-map/types/mapMarkers"
import styles from "../WorldMap.module.css"

type Props = {
  modalRef: RefObject<HTMLElement | null>
  isOpen: boolean
  canCreateMarkers: boolean
  selectedVisibility: "private" | "public" | "active"
  selectedMarkerGroupId: string
  selectedMarkerGroups: MarkerGroup[]
  selectedMarkerGroup: MarkerGroup | null
  allMarkerGroups: MarkerGroup[]
  visibleMarkerGroupIds: string[]
  setSelectedVisibility: (value: "private" | "public" | "active") => void
  setSelectedMarkerGroupId: (value: string) => void
  setAreMarkersVisible: (value: boolean) => void
  setVisibleMarkerGroupIds: (value: string[]) => void
  toggleMarkerGroupVisibility: (groupId: string) => void
  onCreate: () => void
  onEdit: () => void
  onClear: () => void
  onClose: () => void
}

export function MapMarkersModal({
  modalRef,
  isOpen,
  canCreateMarkers,
  selectedVisibility,
  selectedMarkerGroupId,
  selectedMarkerGroups,
  selectedMarkerGroup,
  allMarkerGroups,
  visibleMarkerGroupIds,
  setSelectedVisibility,
  setSelectedMarkerGroupId,
  setAreMarkersVisible,
  setVisibleMarkerGroupIds,
  toggleMarkerGroupVisibility,
  onCreate,
  onEdit,
  onClear,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Marcadores">
      <section ref={modalRef} className={styles.modal} tabIndex={-1}>
        <div className={styles.modalHeader}>
          <h2>Marcadores</h2>
          <div className={styles.modalHeaderActions}>
            {canCreateMarkers ? (
              <button
                type="button"
                className={styles.iconButton}
                onClick={onCreate}
                aria-label="Criar marcadores"
                title="Criar marcadores"
              >
                <Plus size={16} />
              </button>
            ) : null}
            <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className={styles.segmentedTabs}>
          <button
            type="button"
            className={`${styles.segmentedTab} ${selectedVisibility === "public" ? styles.segmentedTabActive : ""}`}
            onClick={() => setSelectedVisibility("public")}
          >
            Publicos
          </button>
          <button
            type="button"
            className={`${styles.segmentedTab} ${selectedVisibility === "private" ? styles.segmentedTabActive : ""}`}
            onClick={() => setSelectedVisibility("private")}
          >
            Privados
          </button>
          <button
            type="button"
            className={`${styles.segmentedTab} ${selectedVisibility === "active" ? styles.segmentedTabActive : ""}`}
            onClick={() => setSelectedVisibility("active")}
          >
            Ativos
          </button>
        </div>
        {selectedVisibility === "active" ? (
          <div className={styles.field}>
            <span>Grupos visiveis no mapa</span>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setAreMarkersVisible(true)
                  setVisibleMarkerGroupIds(allMarkerGroups.map((group) => group.id))
                }}
              >
                Marcar todos
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setVisibleMarkerGroupIds([])}
              >
                Desmarcar todos
              </button>
            </div>
            {allMarkerGroups.length > 0 ? (
              <div className={styles.markerVisibilityList}>
                {allMarkerGroups.map((group) => (
                  <label key={group.id} className={styles.markerVisibilityItem}>
                    <input
                      type="checkbox"
                      checked={visibleMarkerGroupIds.includes(group.id)}
                      onChange={() => toggleMarkerGroupVisibility(group.id)}
                    />
                    <span className={styles.markerVisibilityName}>{group.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.modalSubtle}>Nenhum grupo criado ainda.</p>
            )}
          </div>
        ) : selectedMarkerGroups.length > 0 ? (
          <>
            <label className={styles.field}>
              <span>Tipo</span>
              <select value={selectedMarkerGroupId} onChange={(event) => setSelectedMarkerGroupId(event.target.value)}>
                <option value="">Selecione um grupo</option>
                {selectedMarkerGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onEdit}
                disabled={!selectedMarkerGroup}
              >
                <Pencil size={16} />
                <span>Editar</span>
              </button>
              <button type="button" className={styles.secondaryButton} onClick={onClear}>
                <span>Limpar</span>
              </button>
            </div>
          </>
        ) : (
          <p className={styles.modalSubtle}>
            {selectedVisibility === "public"
              ? "Nenhum grupo publico criado ainda."
              : selectedVisibility === "private"
                ? "Nenhum grupo privado criado ainda."
                : "Nenhum grupo criado ainda."}
          </p>
        )}
      </section>
    </div>
  )
}
