"use client"

import { Check, Pencil, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { updateProfileClientUseCase } from "@/application/profile/use-cases/updateProfileClient"
import { createProfileDependencies } from "@/presentation/profile/dependencies"
import styles from "./ProfilePage.module.css"

type Props = {
  field: "name" | "username"
  value: string | null
  displayValue: string
  editLabel: string
}

export default function ProfileEditableField({ field, value, displayValue, editLabel }: Props) {
  const router = useRouter()
  const deps = useMemo(() => createProfileDependencies("http"), [])
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? "")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    setIsSaving(true)
    setError("")

    try {
      await updateProfileClientUseCase(deps, { [field]: draft })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar perfil.")
    } finally {
      setIsSaving(false)
    }
  }

  function cancel() {
    setDraft(value ?? "")
    setError("")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <span className={styles.editableEditor}>
        <span className={styles.editableInputRow}>
          <input
            className={styles.editableInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
            aria-label={editLabel}
          />
          <button
            type="button"
            className={styles.iconButton}
            onClick={save}
            disabled={isSaving}
            aria-label="Salvar"
            title="Salvar"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={cancel}
            disabled={isSaving}
            aria-label="Cancelar"
            title="Cancelar"
          >
            <X size={14} />
          </button>
        </span>
        {error ? <small className={styles.editableError}>{error}</small> : null}
      </span>
    )
  }

  return (
    <strong className={styles.editableValue}>
      {displayValue}
      <button
        type="button"
        className={styles.iconButton}
        onClick={() => setIsEditing(true)}
        aria-label={editLabel}
        title={editLabel}
      >
        <Pencil size={14} />
      </button>
    </strong>
  )
}
