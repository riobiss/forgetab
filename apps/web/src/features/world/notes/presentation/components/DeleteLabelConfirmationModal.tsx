import { Trash2 } from "lucide-react"
import styles from "../LocalNotesPage.module.css"

type DeleteLabelConfirmationModalProps = {
  labelName: string
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteLabelConfirmationModal({
  labelName,
  isDeleting,
  onCancel,
  onConfirm
}: DeleteLabelConfirmationModalProps) {
  return (
    <div
      className={`${styles.modalBackdrop} ${styles.confirmationBackdrop}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel()
      }}
    >
      <section
        className={styles.confirmationModal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-label-title"
        aria-describedby="delete-label-description"
      >
        <div className={styles.confirmationIcon} aria-hidden="true">
          <Trash2 size={22} />
        </div>
        <div>
          <h2 id="delete-label-title">Excluir marcador?</h2>
          <p id="delete-label-description">
            O marcador <strong>“{labelName}”</strong> será removido das notas.
            As notas não serão excluídas.
          </p>
        </div>
        <footer className={styles.confirmationActions}>
          <button type="button" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmDeleteButton}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir marcador"}
          </button>
        </footer>
      </section>
    </div>
  )
}
