"use client"

import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"
import styles from "../CharacterEditorForm.module.css"
import type { CharacterEditorTemplateFieldDto } from "@/application/characters/editor"

type NumericInputValue = number | ""

type Props = {
  title: string
  items: CharacterEditorTemplateFieldDto[]
  values: Record<string, NumericInputValue>
  visible: boolean
  keyPrefix: string
  min?: number
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
  onToggle,
  onChange,
}: Props) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <button type="button" className={styles.sectionToggleButton} onClick={onToggle}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {visible ? (
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
