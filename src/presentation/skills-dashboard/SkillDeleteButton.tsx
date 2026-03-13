"use client"

import { Trash2 } from "lucide-react"
import styles from "./SkillsDashboardClient.module.css"

type SkillDeleteButtonProps = {
  onDelete: () => void
  disabled?: boolean
}

export function SkillDeleteButton({ onDelete, disabled = false }: SkillDeleteButtonProps) {
  return (
    <button
      type="button"
      className={styles.modalDangerIconButton}
      onClick={onDelete}
      disabled={disabled}
      aria-label="Deletar"
      title="Deletar"
    >
      <Trash2 size={18} />
    </button>
  )
}
