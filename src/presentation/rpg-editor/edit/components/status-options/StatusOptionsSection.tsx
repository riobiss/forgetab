"use client"

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import styles from "./StatusOptionsSection.module.css"
import type { CatalogOption } from "../shared/types"

type Props = {
  showList: boolean
  onToggleList: () => void
  coreStatusOptions: readonly CatalogOption[]
  selectedStatusKeys: string[]
  statusLabelByKey: Record<string, string>
  newCustomStatusLabel: string
  onNewCustomStatusLabelChange: (value: string) => void
  onToggleStatus: (key: string) => void
  onAddCustomStatus: () => void
  onUpdateCustomStatusLabel: (key: string, value: string) => void
  onRemoveCustomStatus: (key: string) => void
}

export default function StatusOptionsSection({
  showList,
  onToggleList,
  coreStatusOptions,
  selectedStatusKeys,
  statusLabelByKey,
  newCustomStatusLabel,
  onNewCustomStatusLabelChange,
  onToggleStatus,
  onAddCustomStatus,
  onUpdateCustomStatusLabel,
  onRemoveCustomStatus,
}: Props) {
  const customKeys = selectedStatusKeys.filter(
    (key) => !coreStatusOptions.some((option) => option.key === key),
  )

  return (
    <div className={styles.section}>
      <h3>Status</h3>
      <div className={styles.headerActions}>
        <button type="button" onClick={onToggleList}>
          {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showList ? "Ocultar status" : "Mostrar status"}
        </button>
      </div>

      {showList ? (
        <div className={styles.grid}>
          {coreStatusOptions.map((item) => (
            <label key={item.key} className={styles.option}>
              <input
                type="checkbox"
                checked={selectedStatusKeys.includes(item.key)}
                onChange={() => onToggleStatus(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      ) : null}

      {showList ? (
        <>
          <div className={styles.actions}>
            <input
              type="text"
              value={newCustomStatusLabel}
              onChange={(event) => onNewCustomStatusLabelChange(event.target.value)}
              placeholder="Ex.: Energia Arcana"
            />
            <button
              type="button"
              className={styles.iconOnlyButton}
              aria-label="Criar status"
              title="Criar status"
              onClick={onAddCustomStatus}
            >
              <Plus size={16} />
            </button>
          </div>

          {customKeys.length > 0 ? (
            <div className={styles.actions}>
              {customKeys.map((key) => (
                <div key={key} className={styles.actions}>
                  <input
                    type="text"
                    value={statusLabelByKey[key] ?? key}
                    onChange={(event) => onUpdateCustomStatusLabel(key, event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.iconOnlyButton}
                    aria-label="Remover status"
                    title="Remover status"
                    onClick={() => onRemoveCustomStatus(key)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
