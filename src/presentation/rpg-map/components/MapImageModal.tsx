"use client"

import type { RefObject } from "react"
import { X } from "lucide-react"
import styles from "../WorldMap.module.css"

type Props = {
  modalRef: RefObject<HTMLDivElement | null>
  isOpen: boolean
  isUploading: boolean
  hasCustomMapImage: boolean
  onOpenFilePicker: () => void
  onResetMapImage: () => void
  onClose: () => void
}

export function MapImageModal({
  modalRef,
  isOpen,
  isUploading,
  hasCustomMapImage,
  onOpenFilePicker,
  onResetMapImage,
  onClose,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Editar imagem do mapa">
      <div className={styles.modal} ref={modalRef} tabIndex={-1}>
        <header className={styles.modalHeader}>
          <div>
            <h2>Editar imagem</h2>
            <p className={styles.modalSubtle}>Envie, troque ou remova a imagem usada no mapa.</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar edicao de imagem">
            <X size={16} />
          </button>
        </header>

        <div className={styles.imageModalActions}>
          <button
            type="button"
            onClick={onOpenFilePicker}
            className={styles.primaryButton}
            disabled={isUploading}
          >
            <span>
              {isUploading
                ? "Enviando..."
                : hasCustomMapImage
                  ? "Trocar imagem"
                  : "Enviar imagem"}
            </span>
          </button>
          <button
            type="button"
            onClick={onResetMapImage}
            className={styles.secondaryDangerButton}
            disabled={isUploading || !hasCustomMapImage}
          >
            <span>Deletar imagem</span>
          </button>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
