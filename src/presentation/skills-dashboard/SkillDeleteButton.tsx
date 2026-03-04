"use client"

import styles from "./SkillsDashboardClient.module.css"

type SkillDeleteButtonProps = {
  onDelete: () => void
  disabled?: boolean
}

export function SkillDeleteButton({ onDelete, disabled = false }: SkillDeleteButtonProps) {
  return (
    <button
      type="button"
      className={styles.ghostButton}
      onClick={onDelete}
      disabled={disabled}
    >
      Deletar
    </button>
  )
}

