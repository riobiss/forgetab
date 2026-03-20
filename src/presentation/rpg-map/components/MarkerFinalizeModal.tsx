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
  isImageUploading: boolean
  setMarkerGroupName: (value: string) => void
  setMarkerGroupColor: (value: string) => void
  setPendingMarkers: (updater: (current: PendingMarker[]) => PendingMarker[]) => void
  onPickImage: (target: { mode: "pending"; markerId: string }) => void
  onDeleteImage: (target: { mode: "pending"; markerId: string }, imageUrl: string | null) => void
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
  isImageUploading,
  setMarkerGroupName,
  setMarkerGroupColor,
  setPendingMarkers,
  onPickImage,
  onDeleteImage,
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
                  placeholder="Nome"
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
              <div className={styles.markerDraftFields}>
                <input
                  value={marker.location}
                  placeholder="Localizacao"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  inputMode="text"
                  data-lpignore="true"
                  onChange={(event) =>
                    setPendingMarkers((current) =>
                      current.map((item) => (item.id === marker.id ? { ...item, location: event.target.value } : item)),
                    )
                  }
                />
                <div className={styles.markerImageField}>
                  {marker.image ? (
                    <img
                      src={marker.image.trim()}
                      alt={marker.name}
                      className={styles.markerImagePreview}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={styles.markerImagePlaceholder}>Sem imagem</div>
                  )}
                  <div className={styles.markerImageActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => onPickImage({ mode: "pending", markerId: marker.id })}
                      disabled={isImageUploading}
                    >
                      {marker.image ? "Trocar imagem" : "Adicionar imagem"}
                    </button>
                    {marker.image ? (
                      <button
                        type="button"
                        className={styles.secondaryDangerButton}
                        onClick={() => onDeleteImage({ mode: "pending", markerId: marker.id }, marker.image)}
                        disabled={isImageUploading}
                      >
                        Deletar imagem
                      </button>
                    ) : null}
                  </div>
                </div>
                <textarea
                  value={marker.shortDescription}
                  placeholder="Descricao"
                  rows={3}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  data-lpignore="true"
                  onChange={(event) =>
                    setPendingMarkers((current) =>
                      current.map((item) => (item.id === marker.id ? { ...item, shortDescription: event.target.value } : item)),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
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
