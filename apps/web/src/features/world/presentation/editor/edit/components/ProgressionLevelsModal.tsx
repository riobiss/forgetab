import { useEffect, useRef } from "react"
import { Plus, Trash2 } from "lucide-react"
import type {
  ProgressionMode,
  ProgressionTier
} from "@forgetab/world-contracts/rpg/progression"
import styles from "../page.module.css"

type Props = {
  open: boolean
  mode: ProgressionMode
  tiers: ProgressionTier[]
  onClose: () => void
  onAdd: () => void
  onRemove: (index: number) => void
  onLabelChange: (index: number, value: string) => void
  onRequiredChange: (index: number, value: number) => void
}

export default function ProgressionLevelsModal({
  open,
  mode,
  tiers,
  onClose,
  onAdd,
  onRemove,
  onLabelChange,
  onRequiredChange
}: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
      return
    }

    const current = document.activeElement
    if (current instanceof HTMLElement) previousFocusRef.current = current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const rafId = window.requestAnimationFrame(() => modalRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(rafId)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={styles.progressionModalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`${styles.progressionModalCard} ${styles.progressionLevelsModalCard}`}
        role="dialog"
        aria-modal="true"
        aria-label="Editar etapas da progressao"
        tabIndex={-1}
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Editar etapas</h3>
        <p>Ajuste nome e required de cada etapa.</p>
        <div className={styles.progressionLevelsBody}>
          <div className={styles.progressionTable}>
            {tiers.map((tier, index) => (
              <div
                key={`progression-tier-${index}`}
                className={styles.progressionRow}
              >
                <label className={styles.field}>
                  <span>Nome</span>
                  {mode === "xp_level" ? (
                    <div
                      className={styles.readonlyTierLabel}
                    >{`Level ${index + 1}`}</div>
                  ) : (
                    <input
                      type="text"
                      value={tier.label}
                      onChange={(event) =>
                        onLabelChange(index, event.target.value)
                      }
                      placeholder={
                        mode === "rank"
                          ? `Novato ${index + 1}`
                          : `Etapa ${index + 1}`
                      }
                    />
                  )}
                </label>
                <label className={styles.field}>
                  <span>Required</span>
                  <input
                    type="number"
                    onWheel={(event) => event.currentTarget.blur()}
                    min={0}
                    required
                    value={tier.required === 0 ? "" : tier.required}
                    placeholder="Digite um numero"
                    onChange={(event) =>
                      onRequiredChange(index, Number(event.target.value || 0))
                    }
                  />
                </label>
                <button
                  type="button"
                  className={styles.progressionDelete}
                  onClick={() => onRemove(index)}
                  disabled={tiers.length <= 1}
                  aria-label={`Remover etapa ${index + 1}`}
                  title="Remover etapa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.progressionAdd}
            onClick={onAdd}
          >
            <Plus size={14} />
            Adicionar etapa
          </button>
        </div>
        <button
          type="button"
          className={styles.progressionModalCloseButton}
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
