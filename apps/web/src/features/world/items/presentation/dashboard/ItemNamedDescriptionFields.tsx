import type { ItemUpsertModalProps, NamedDescription } from "./itemEditorTypes"
import styles from "./ItemsDashboardClient.module.css"

type Props = Pick<
  ItemUpsertModalProps,
  "updateNamedEntry" | "createEmptyNamedDescription"
> & {
  title: string
  nameLabel: string
  descriptionLabel: string
  entries: NamedDescription[]
  setEntries: ItemUpsertModalProps["setAbilities"]
}

export function ItemNamedDescriptionFields({
  title,
  nameLabel,
  descriptionLabel,
  entries,
  setEntries,
  updateNamedEntry,
  createEmptyNamedDescription
}: Props) {
  function update(field: keyof NamedDescription, value: string) {
    setEntries((current) =>
      updateNamedEntry(
        current.length > 0 ? current : [createEmptyNamedDescription()],
        0,
        field,
        value
      )
    )
  }

  return (
    <div className={styles.formGrid}>
      <div className={`${styles.editorSection} ${styles.spanTwo}`}>
        <h4>{title}</h4>
        <div className={styles.multiCard}>
          <label className={styles.field}>
            <span>{nameLabel}</span>
            <input
              value={entries[0]?.name ?? ""}
              onChange={(event) => update("name", event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>{descriptionLabel}</span>
            <textarea
              rows={3}
              value={entries[0]?.description ?? ""}
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
