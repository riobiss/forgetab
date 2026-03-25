"use client"

import Image from "next/image"
import type { RefObject } from "react"
import { X } from "lucide-react"
import type { MarkerPinStyle } from "@/presentation/rpg-map/types/mapMarkers"
import styles from "../WorldMap.module.css"

type Props = {
  modalRef: RefObject<HTMLElement | null>
  markerName: string
  markerLocation: string
  markerImage: string
  markerDescription: string
  markerColor: string
  markerSize: number
  markerPinStyle: MarkerPinStyle
  markerColors: string[]
  linkedSectionId: string
  sectionOptions: Array<{ id: string; name: string }>
  isImageUploading: boolean
  markerId: string | null
  onChangeName: (value: string) => void
  onChangeLocation: (value: string) => void
  onChangeDescription: (value: string) => void
  onChangeColor: (value: string) => void
  onChangeSize: (value: number) => void
  onChangePinStyle: (value: MarkerPinStyle) => void
  onChangeLinkedSection: (value: string) => void
  onPickImage: (target: { mode: "editing"; markerId: string }) => void
  onDeleteImage: (target: { mode: "editing"; markerId: string }, imageUrl: string | null) => void
  onChangePosition: () => void
  onSave: () => void
  onClose: () => void
}

export function MarkerEditModal({
  modalRef,
  markerName,
  markerLocation,
  markerImage,
  markerDescription,
  markerColor,
  markerSize,
  markerPinStyle,
  markerColors,
  linkedSectionId,
  sectionOptions,
  isImageUploading,
  markerId,
  onChangeName,
  onChangeLocation,
  onChangeDescription,
  onChangeColor,
  onChangeSize,
  onChangePinStyle,
  onChangeLinkedSection,
  onPickImage,
  onDeleteImage,
  onChangePosition,
  onSave,
  onClose,
}: Props) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Editar marcador">
      <section ref={modalRef} className={`${styles.modal} ${styles.markerEditModal}`} tabIndex={-1}>
        <div className={styles.modalHeader}>
          <h2>Editar marcador</h2>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        <label className={styles.field}>
          <span>Nome</span>
          <input
            value={markerName}
            onChange={(event) => onChangeName(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            inputMode="text"
            data-lpignore="true"
          />
        </label>
        <label className={styles.field}>
          <span>Localizacao</span>
          <input
            value={markerLocation}
            onChange={(event) => onChangeLocation(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            inputMode="text"
            data-lpignore="true"
          />
        </label>
        <label className={styles.field}>
          <span>Imagem</span>
          <div className={styles.markerImageField}>
            {markerImage ? (
              <div className={styles.markerImagePreviewWrap}>
                <Image
                  src={markerImage.trim()}
                  alt={markerName || "Marcador"}
                  className={styles.markerImagePreview}
                  fill
                  sizes="160px"
                  unoptimized
                />
              </div>
            ) : (
              <div className={styles.markerImagePlaceholder}>Sem imagem</div>
            )}
            <div className={styles.markerImageActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => markerId && onPickImage({ mode: "editing", markerId })}
                disabled={isImageUploading || !markerId}
              >
                {markerImage ? "Trocar imagem" : "Adicionar imagem"}
              </button>
              {markerImage ? (
                <button
                  type="button"
                  className={styles.secondaryDangerButton}
                  onClick={() => markerId && onDeleteImage({ mode: "editing", markerId }, markerImage)}
                  disabled={isImageUploading || !markerId}
                >
                  Deletar imagem
                </button>
              ) : null}
            </div>
          </div>
        </label>
        <label className={styles.field}>
          <span>Descricao</span>
          <textarea
            value={markerDescription}
            rows={4}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            data-lpignore="true"
            onChange={(event) => onChangeDescription(event.target.value)}
          />
        </label>
        <div className={styles.field}>
          <span>Cor</span>
          <div className={styles.markerColorRow}>
            {markerColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChangeColor(color)}
                className={`${styles.colorOption} ${markerColor === color ? styles.colorOptionActive : ""}`}
                style={{ backgroundColor: color }}
                aria-label={`Cor ${color}`}
              />
            ))}
            <label
              className={`${styles.colorOption} ${styles.customColorOption} ${!markerColors.includes(markerColor) ? styles.colorOptionActive : ""}`}
              style={{ backgroundColor: markerColor }}
              aria-label="Selecionar cor personalizada"
              title="Selecionar cor personalizada"
            >
              <input
                type="color"
                value={markerColor}
                onChange={(event) => onChangeColor(event.currentTarget.value)}
                className={styles.customColorInput}
              />
            </label>
          </div>
        </div>
        <label className={styles.field}>
          <span>Tamanho</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={markerSize}
            onChange={(event) => onChangeSize(Number(event.currentTarget.value))}
          />
          <small className={styles.modalSubtle}>{markerSize.toFixed(1)}x</small>
        </label>
        <label className={styles.field}>
          <span>Estilo do pin</span>
          <select value={markerPinStyle} onChange={(event) => onChangePinStyle(event.target.value as MarkerPinStyle)}>
            <option value="default">Padrao</option>
            <option value="label">Somente nome</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Vincular a secao</span>
          <select value={linkedSectionId} onChange={(event) => onChangeLinkedSection(event.target.value)}>
            <option value="">Nenhuma secao</option>
            {sectionOptions.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onChangePosition}>
            Mudar posicao
          </button>
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
