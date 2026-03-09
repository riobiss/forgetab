"use client"

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import styles from "./PlayerTemplateFieldsSection.module.css"
import type { CharacterIdentityTemplate } from "../shared/types"

type Props = {
  title: string
  description: string
  showList: boolean
  onToggleList: () => void
  toggleLabelOpen: string
  toggleLabelClosed: string
  newFieldLabel: string
  onNewFieldLabelChange: (value: string) => void
  addPlaceholder: string
  addAriaLabel: string
  addTitle: string
  onAddField: () => void
  fields: CharacterIdentityTemplate[]
  onUpdateFieldLabel: (index: number, value: string) => void
  onUpdateFieldRequired: (index: number, value: boolean) => void
  onRemoveField: (index: number) => void
  removeLabelPrefix: string
}

export default function PlayerTemplateFieldsSection({
  title,
  description,
  showList,
  onToggleList,
  toggleLabelOpen,
  toggleLabelClosed,
  newFieldLabel,
  onNewFieldLabelChange,
  addPlaceholder,
  addAriaLabel,
  addTitle,
  onAddField,
  fields,
  onUpdateFieldLabel,
  onUpdateFieldRequired,
  onRemoveField,
  removeLabelPrefix,
}: Props) {
  return (
    <div className={styles.section}>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className={styles.headerActions}>
        <button type="button" onClick={onToggleList}>
          {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showList ? toggleLabelOpen : toggleLabelClosed}
        </button>
      </div>

      {showList ? (
        <>
          <div className={styles.actions}>
            <input
              type="text"
              value={newFieldLabel}
              onChange={(event) => onNewFieldLabelChange(event.target.value)}
              placeholder={addPlaceholder}
            />
            <button
              type="button"
              className={styles.iconOnlyButton}
              aria-label={addAriaLabel}
              title={addTitle}
              onClick={onAddField}
            >
              <Plus size={16} />
            </button>
          </div>

          {fields.length === 0 ? <p>Nenhum campo configurado.</p> : null}
          {fields.map((field, index) => (
            <div key={field.key} className={styles.actions}>
              <input
                type="text"
                value={field.label}
                onChange={(event) => onUpdateFieldLabel(index, event.target.value)}
              />
              <label className={styles.option}>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) => onUpdateFieldRequired(index, event.target.checked)}
                />
                <span>Obrigatorio</span>
              </label>
              <button
                type="button"
                className={styles.iconOnlyButton}
                aria-label={`${removeLabelPrefix} ${field.label}`}
                title={`${removeLabelPrefix} ${field.label}`}
                onClick={() => onRemoveField(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </>
      ) : null}
    </div>
  )
}
