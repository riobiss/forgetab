"use client"

import styles from "../../CharactersDashboardPage.module.css"

type Props = {
  isOpen: boolean
  newFieldKey: string
  newFieldValue: string
  onClose: () => void
  onKeyChange: (value: string) => void
  onValueChange: (value: string) => void
  onSubmit: () => void
}

export default function NpcMonsterExtraFieldModal({
  isOpen,
  newFieldKey,
  newFieldValue,
  onClose,
  onKeyChange,
  onValueChange,
  onSubmit,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className={styles.nestedModalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Novo campo"
      onClick={onClose}
    >
      <section className={styles.nestedModalShell} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.nestedModalTitle}>Novo campo</h3>
        <label className={styles.modalField}>
          <span>Chave</span>
          <input value={newFieldKey} onChange={(event) => onKeyChange(event.target.value)} />
        </label>
        <label className={styles.modalField}>
          <span>Valor</span>
          <input value={newFieldValue} onChange={(event) => onValueChange(event.target.value)} />
        </label>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.modalSecondaryButton} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={styles.modalPrimaryButton} onClick={onSubmit}>
            Criar campo
          </button>
        </div>
      </section>
    </div>
  )
}
