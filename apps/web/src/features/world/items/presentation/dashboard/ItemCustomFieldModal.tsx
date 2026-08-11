import type { RefObject } from "react"
import type { ItemUpsertModalProps } from "./itemEditorTypes"
import styles from "./ItemsDashboardClient.module.css"

type Props = Pick<
  ItemUpsertModalProps,
  | "newCustomFieldName"
  | "setNewCustomFieldName"
  | "newCustomFieldValue"
  | "setNewCustomFieldValue"
  | "onAddCustomField"
> & {
  modalRef: RefObject<HTMLElement | null>
  onClose: () => void
}

export function ItemCustomFieldModal(props: Props) {
  return (
    <div
      className={styles.nestedModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Novo campo"
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault()
      }}
    >
      <section
        ref={props.modalRef}
        className={styles.nestedModalCard}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        tabIndex={-1}
      >
        <h3>Novo campo</h3>
        <label className={styles.field}>
          <span>Nome</span>
          <input
            value={props.newCustomFieldName}
            onChange={(event) =>
              props.setNewCustomFieldName(event.target.value)
            }
          />
        </label>
        <label className={styles.field}>
          <span>Valor</span>
          <input
            value={props.newCustomFieldValue}
            onChange={(event) =>
              props.setNewCustomFieldValue(event.target.value)
            }
          />
        </label>
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={props.onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={props.onAddCustomField}
          >
            Criar campo
          </button>
        </div>
      </section>
    </div>
  )
}
