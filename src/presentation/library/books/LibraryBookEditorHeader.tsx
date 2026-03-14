"use client"

import { Keyboard, Save } from "lucide-react"
import styles from "./LibraryBookEditorClient.module.css"

type Props = {
  sectionTitle: string
  pageTitle: string
  canEdit: boolean
  hasDraft: boolean
  contentEditing: boolean
  saving: boolean
  onToggleEditing: () => void
  onSave: () => void
}

export default function LibraryBookEditorHeader({
  sectionTitle,
  pageTitle,
  canEdit,
  hasDraft,
  contentEditing,
  saving,
  onToggleEditing,
  onSave,
}: Props) {
  return (
    <section className={styles.header}>
      <div className={styles.headerText}>
        <p className={styles.kicker}>{sectionTitle}</p>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{pageTitle}</h1>
          {canEdit ? (
            <div className={styles.headerActions}>
              {hasDraft ? <span className={styles.draftLabel}>Rascunho</span> : null}
              <button
                type="button"
                className={contentEditing ? styles.primaryButton : styles.secondaryButton}
                onClick={onToggleEditing}
                aria-label={contentEditing ? "Parar edicao de conteudo" : "Editar conteudo"}
                title={contentEditing ? "Parar edicao" : "Escrever"}
              >
                <Keyboard size={16} />
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={onSave}
                disabled={saving || !contentEditing}
                aria-label={saving ? "Salvando" : "Salvar"}
                title={saving ? "Salvando..." : "Salvar"}
              >
                <Save size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
