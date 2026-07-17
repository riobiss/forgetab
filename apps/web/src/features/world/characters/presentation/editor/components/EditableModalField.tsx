"use client"

import { useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import styles from "../CharacterEditorForm.module.css"

type Props = {
  label: string
  value: string | number
  onSave: (value: string) => void
  type?: "text" | "number"
  required?: boolean
  min?: number
  step?: string
  placeholder?: string
  disabled?: boolean
  displayValue?: string
}

export default function EditableModalField({
  label,
  value,
  onSave,
  type = "text",
  required = false,
  min,
  step,
  placeholder,
  disabled = false,
  displayValue,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ""))
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setDraft(String(value ?? ""))
      setError("")
    }
  }, [isOpen, value])

  function handleSave() {
    if (required && draft.trim().length === 0) {
      setError("Campo obrigatorio.")
      return
    }

    onSave(draft)
    setIsOpen(false)
  }

  const resolvedDisplayValue =
    displayValue ?? (String(value ?? "").trim().length > 0 ? String(value) : "Nao informado")

  return (
    <div className={styles.editableField}>
      <span className={styles.editableFieldLabel}>{label}</span>
      <div className={styles.editableFieldRow}>
        <span className={styles.editableFieldValue}>{resolvedDisplayValue}</span>
        <button
          type="button"
          className={styles.editableFieldButton}
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          aria-label={`Editar ${label}`}
          title={`Editar ${label}`}
        >
          <Pencil size={15} />
        </button>
      </div>

      {isOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={`Editar ${label}`}>
          <section className={styles.modalCard}>
            <span className={styles.modalTitle}>{label}</span>
            <label className={styles.field}>
              <input
                type={type}
                onWheel={type === "number" ? (event) => event.currentTarget.blur() : undefined}
                min={min}
                step={step}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  setError("")
                }}
                placeholder={placeholder}
                required={required}
                autoFocus
              />
            </label>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.modalActions}>
              <button type="button" onClick={handleSave}>
                Salvar
              </button>
              <button
                type="button"
                className={styles.secondaryInlineButton}
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
