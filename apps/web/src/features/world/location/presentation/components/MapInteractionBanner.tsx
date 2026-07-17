"use client"

import styles from "../WorldMap.module.css"

type Props = {
  title: string
  description: string
  actions: Array<{
    key: string
    label: string
    onClick: () => void
    disabled?: boolean
  }>
}

export function MapInteractionBanner({ title, description, actions }: Props) {
  return (
    <div className={styles.selectionModalWrap}>
      <div className={styles.selectionBanner}>
        <div>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
        <div className={styles.selectionActions}>
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className={styles.actionButton}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
