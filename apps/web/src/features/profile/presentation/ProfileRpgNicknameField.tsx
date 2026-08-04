"use client"

import { Check, Pencil, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateRpgProfileClientUseCase } from "@/features/profile/application/use-cases/updateProfileClient"
import { profileDependencies } from "@/features/profile/presentation/dependencies"
import styles from "./ProfilePage.module.css"

type Props = {
  rpgId: string
  nickname: string | null
}

export default function ProfileRpgNicknameField({ rpgId, nickname }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(nickname ?? "")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    setIsSaving(true)
    setError("")

    try {
      await updateRpgProfileClientUseCase(profileDependencies, {
        rpgId,
        payload: {
          displayName: draft,
        },
      })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao atualizar apelido.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  function cancel() {
    setDraft(nickname ?? "")
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
            aria-label="Editar apelido no RPG"
          />
          <button
            type="button"
            className={styles.iconButton}
            onClick={save}
            disabled={isSaving}
            aria-label="Salvar apelido"
            title="Salvar"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={cancel}
            disabled={isSaving}
            aria-label="Cancelar edicao de apelido"
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
      {nickname ? <span>{nickname}</span> : <span />}
      <button
        type="button"
        className={styles.iconButton}
        onClick={() => setIsEditing(true)}
        aria-label={
          nickname ? "Editar apelido no RPG" : "Adicionar apelido no RPG"
        }
        title={nickname ? "Editar apelido" : "Adicionar apelido"}
      >
        <Pencil size={14} />
      </button>
    </strong>
  )
}
