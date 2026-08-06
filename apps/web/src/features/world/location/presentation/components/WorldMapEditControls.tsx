import Image from "next/image"
import styles from "../WorldMap.module.css"

type Props = {
  canEditContent: boolean
  canManageImage: boolean
  isFullscreen: boolean
  isEditOpen: boolean
  isImageModalOpen: boolean
  isBrushMode: boolean
  isInteractive: boolean
  brushColor: string
  brushSize: number
  brushColors: readonly string[]
  onToggleEdit: () => void
  onOpenImageModal: () => void
  onToggleBrushMode: () => void
  onClearLastDrawing: () => void
  onResetView: () => void
  onChangeBrushSize: (size: number) => void
  onChangeBrushColor: (color: string) => void
}

export function WorldMapEditControls({
  canEditContent,
  canManageImage,
  isFullscreen,
  isEditOpen,
  isImageModalOpen,
  isBrushMode,
  isInteractive,
  brushColor,
  brushSize,
  brushColors,
  onToggleEdit,
  onOpenImageModal,
  onToggleBrushMode,
  onClearLastDrawing,
  onResetView,
  onChangeBrushSize,
  onChangeBrushColor,
}: Props) {
  if (!canEditContent && !canManageImage) return null

  return (
    <>
      <div className={styles.ownerActions}>
        {isFullscreen && canEditContent ? (
          <button
            type="button"
            onClick={onToggleEdit}
            className={styles.editButton}
            aria-expanded={isEditOpen}
            aria-label="Editar mapa"
          >
            Editar
          </button>
        ) : canManageImage ? (
          <button
            type="button"
            onClick={onOpenImageModal}
            className={styles.editButton}
            aria-haspopup="dialog"
            aria-expanded={isImageModalOpen}
            aria-label="Editar imagem do mapa"
          >
            Editar imagem
          </button>
        ) : null}

        {isFullscreen && isEditOpen ? (
          <div className={styles.editPanel}>
            {canEditContent ? (
              <>
                <button
                  type="button"
                  onClick={onToggleBrushMode}
                  className={`${styles.actionButton} ${styles.brushToggle} ${
                    isBrushMode ? styles.brushToggleActive : ""
                  }`}
                  aria-label={
                    isBrushMode
                      ? "Desativar modo pincel"
                      : "Ativar modo pincel"
                  }
                  disabled={!isInteractive}
                >
                  <Image
                    src="/icons/drawIcon.svg"
                    alt="Pincel"
                    width={16}
                    height={16}
                  />
                </button>
                <button
                  type="button"
                  onClick={onClearLastDrawing}
                  className={`${styles.actionButton} ${styles.iconActionButton}`}
                  aria-label="Limpar desenho anterior"
                  title="Limpar desenho anterior"
                >
                  <Image
                    src="/icons/drawBack.svg"
                    alt="Limpar desenho anterior"
                    width={16}
                    height={16}
                    className={styles.whiteIcon}
                  />
                </button>
                <button
                  type="button"
                  onClick={onResetView}
                  className={styles.actionButton}
                >
                  Centralizar
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {isFullscreen && isEditOpen && isBrushMode ? (
        <div className={styles.topControls}>
          <label className={styles.brushSizeControl}>
            Linha
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={(event) =>
                onChangeBrushSize(Number(event.currentTarget.value))
              }
            />
            <span>{brushSize}px</span>
          </label>
          <div
            className={styles.colorPicker}
            role="group"
            aria-label="Cores do pincel"
          >
            {brushColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChangeBrushColor(color)}
                className={`${styles.colorOption} ${
                  brushColor === color ? styles.colorOptionActive : ""
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Cor ${color}`}
                title={`Cor ${color}`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
