"use client"

import styles from "../CharacterEditorForm.module.css"
import type { CharacterIdentityFieldDto } from "@/application/characters/editor"

type Props = {
  title: string
  fields: CharacterIdentityFieldDto[]
  values: Record<string, string>
  onFieldChange: (key: string, value: string) => void
}

export default function CharacterEditorTextSection({ title, fields, values, onFieldChange }: Props) {
  if (fields.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <div className={styles.identityGrid}>
        {fields.map((field) => (
          <label className={styles.field} key={`${title}-${field.key}`}>
            <span>{field.label}</span>
            <input
              type="text"
              value={values[field.key] ?? ""}
              onChange={(event) => onFieldChange(field.key, event.target.value)}
              required={field.required}
            />
          </label>
        ))}
      </div>
    </section>
  )
}
