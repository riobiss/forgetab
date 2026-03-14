"use client"

import Link from "next/link"
import styles from "../CharacterEditorForm.module.css"

type Props = {
  rpgId: string
  editingCharacterId: string | null
  saving: boolean
  deleting: boolean
  canSubmit: boolean
  showDeleteConfirm: boolean
  onCancel?: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

export default function CharacterEditorActions({
  rpgId,
  editingCharacterId,
  saving,
  deleting,
  canSubmit,
  showDeleteConfirm,
  onCancel,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: Props) {
  return (
    <>
      <div className={styles.actions}>
        <button type="submit" disabled={!canSubmit}>
          {saving
            ? editingCharacterId
              ? "Salvando..."
              : "Criando..."
            : editingCharacterId
              ? "Salvar personagem"
              : "Criar personagem"}
        </button>
        {onCancel ? (
          <button
            type="button"
            className={styles.secondaryInlineButton}
            onClick={onCancel}
            disabled={saving || deleting}
          >
            Cancelar
          </button>
        ) : (
          <Link href={`/rpg/${rpgId}/characters`}>Cancelar</Link>
        )}
        {editingCharacterId ? (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={onDeleteRequest}
            disabled={saving || deleting}
          >
            Deletar personagem
          </button>
        ) : null}
      </div>

      {editingCharacterId && showDeleteConfirm ? (
        <div className={styles.deleteNotice}>
          <p>Tem certeza que deseja deletar este personagem?</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={onDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deletando..." : "Confirmar exclusao"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onDeleteCancel}
              disabled={deleting}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
