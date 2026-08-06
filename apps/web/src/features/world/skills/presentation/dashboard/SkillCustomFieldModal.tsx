import type { Dispatch, SetStateAction } from "react"
import styles from "./SkillsDashboardClient.module.css"

type Props = {
  open: boolean
  name: string
  setName: Dispatch<SetStateAction<string>>
  value: string
  setValue: Dispatch<SetStateAction<string>>
  onAdd: () => void
  onClose: () => void
}

export function SkillCustomFieldModal({
  open,
  name,
  setName,
  value,
  setValue,
  onAdd,
  onClose,
}: Props) {
  if (!open) return null

  return (
    <div
      className={styles.nestedModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Novo campo"
      onClick={onClose}
    >
      <section
        className={`${styles.card} ${styles.nestedModalCard}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Novo campo</h3>
        <label className={styles.field}>
          <span>Nome</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Valor</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <div className={styles.actions}>
          <button type="button" className={styles.ghostButton} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={styles.primaryButton} onClick={onAdd}>
            Criar campo
          </button>
        </div>
      </section>
    </div>
  )
}
