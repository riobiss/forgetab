"use client"

import type { RefObject } from "react"
import {
  CUSTOM_FIELD_TYPE_OPTIONS,
  normalizeCustomFieldType,
  type EditableTypedCustomField,
} from "@/components/custom-fields/typedCustomField"
import styles from "./TypedCustomFieldEditor.module.css"

export type { CustomFieldType, EditableTypedCustomField } from "@/components/custom-fields/typedCustomField"
export { CUSTOM_FIELD_TYPE_OPTIONS, normalizeCustomFieldType } from "@/components/custom-fields/typedCustomField"

type Props = {
  field: EditableTypedCustomField
  keyInputRef?: RefObject<HTMLInputElement | null>
  hideLabels?: boolean
  layout?: "inline" | "stacked"
  keyEditable?: boolean
  onChange: (updater: (current: EditableTypedCustomField) => EditableTypedCustomField) => void
}

export function TypedCustomFieldEditor({
  field,
  keyInputRef,
  hideLabels = false,
  layout = "stacked",
  keyEditable = true,
  onChange,
}: Props) {
  const labelClassName = hideLabels ? styles.labelHidden : styles.label

  function renderValueField() {
    if (field.type === "boolean") {
      const normalizedValue = field.value.trim().toLowerCase()
      const currentValue = normalizedValue === "nao" ? "nao" : "sim"

      return (
        <div className={styles.booleanToggle} role="group" aria-label="Valor">
          <button
            type="button"
            className={[
              styles.booleanOption,
              currentValue === "sim" ? styles.booleanOptionActive : "",
            ].filter(Boolean).join(" ")}
            aria-pressed={currentValue === "sim"}
            onClick={() => onChange((current) => ({ ...current, value: "Sim" }))}
          >
            Sim
          </button>
          <button
            type="button"
            className={[
              styles.booleanOption,
              currentValue === "nao" ? styles.booleanOptionActive : "",
            ].filter(Boolean).join(" ")}
            aria-pressed={currentValue === "nao"}
            onClick={() => onChange((current) => ({ ...current, value: "Nao" }))}
          >
            Nao
          </button>
        </div>
      )
    }

    return (
      <input
        className={styles.input}
        aria-label="Valor"
        value={field.value}
        onChange={(event) => onChange((current) => ({ ...current, value: event.target.value }))}
        placeholder="Valor"
      />
    )
  }

  function renderKeyField() {
    return (
      <input
        ref={keyInputRef}
        className={styles.input}
        aria-label="Chave"
        value={field.key}
        onChange={(event) => onChange((current) => ({ ...current, key: event.target.value }))}
        placeholder="Chave"
      />
    )
  }

  function renderTypeField(hideTypeLabel = false) {
    return (
      <div className={styles.field}>
        <span className={hideTypeLabel ? styles.labelHidden : labelClassName}>Tipo</span>
        <select
          className={styles.select}
          aria-label="Tipo"
          value={field.type}
          onChange={(event) => onChange((current) => ({ ...current, type: normalizeCustomFieldType(event.target.value) }))}
        >
          {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (layout === "inline" && !keyEditable) {
    return (
      <div className={styles.inlineReadonlyEditor}>
        <div className={styles.inlineReadonlyHeader}>
          <span className={styles.inlineReadonlyKey}>{field.key}</span>
          <div className={styles.inlineReadonlyType}>{renderTypeField(true)}</div>
        </div>
        <div className={styles.inlineReadonlyValue}>{renderValueField()}</div>
      </div>
    )
  }

  return (
    <div
      className={[
        styles.grid,
        layout === "stacked" ? styles.stacked : styles.inline,
      ].filter(Boolean).join(" ")}
    >
      {keyEditable ? (
        <label className={styles.field}>
          <span className={labelClassName}>Chave</span>
          {renderKeyField()}
        </label>
      ) : null}
      <label className={styles.field}>
        <span className={labelClassName}>Valor</span>
        {renderValueField()}
      </label>
      {renderTypeField()}
    </div>
  )
}
