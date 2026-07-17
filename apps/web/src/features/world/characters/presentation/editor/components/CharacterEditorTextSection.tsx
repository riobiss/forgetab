"use client"

import styles from "../CharacterEditorForm.module.css"
import type { CharacterIdentityFieldDto } from "@/features/world/characters/application/characters/editor"
import EditableModalField from "./EditableModalField"

type Props = {
  title: string
  fields: CharacterIdentityFieldDto[]
  values: Record<string, string>
  editInModal?: boolean
  onFieldChange: (key: string, value: string) => void
}

export default function CharacterEditorTextSection({
  title,
  fields,
  values,
  editInModal = false,
  onFieldChange,
}: Props) {
  if (fields.length === 0) {
    return null
  }

  return (
    <section className={`${styles.section} characterEditorSection`}>
      <h2>{title}</h2>
      <div className={styles.identityGrid}>
        {fields.map((field) => (
          editInModal ? (
            <EditableModalField
              key={`${title}-${field.key}`}
              label={field.label}
              value={values[field.key] ?? ""}
              required={field.required}
              onSave={(value) => onFieldChange(field.key, value)}
            />
          ) : (
            <label className={styles.field} key={`${title}-${field.key}`}>
              <span>{field.label}</span>
              <input
                type="text"
                value={values[field.key] ?? ""}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
                required={field.required}
              />
            </label>
          )
        ))}
      </div>
    </section>
  )
}
