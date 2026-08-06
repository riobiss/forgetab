"use client"

import NumericTemplateGrid from "@/features/world/presentation/components/NumericTemplateGrid"
import styles from "../CharacterEditorForm.module.css"
import type { CharacterEditorTemplateFieldDto } from "@/features/world/characters/application/editor"
import EditableModalField from "./EditableModalField"

type NumericInputValue = number | ""

type Props = {
  title: string
  items: CharacterEditorTemplateFieldDto[]
  values: Record<string, NumericInputValue>
  visible: boolean
  keyPrefix: string
  min?: number
  editInModal?: boolean
  onToggle: () => void
  onChange: (key: string, value: string) => void
}

export default function CharacterEditorNumericSection({
  title,
  items,
  values,
  visible,
  keyPrefix,
  min,
  editInModal = false,
  onToggle,
  onChange,
}: Props) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className={`${styles.section} characterEditorSection`}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <button type="button" className={styles.sectionToggleButton} onClick={onToggle}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {visible && editInModal ? (
        <div className={styles.valuesGrid}>
          {items.map((item) => (
            <EditableModalField
              key={`${keyPrefix}-${item.key}`}
              label={item.label}
              type="number"
              min={min}
              value={values[item.key] ?? ""}
              onSave={(value) => onChange(item.key, value)}
            />
          ))}
        </div>
      ) : visible ? (
        <NumericTemplateGrid
          items={items.map((item) => ({
            key: item.key,
            label: item.label,
          }))}
          values={values}
          onChange={onChange}
          gridClassName={styles.valuesGrid}
          fieldClassName={styles.field}
          keyPrefix={keyPrefix}
          min={min}
        />
      ) : null}
    </section>
  )
}
