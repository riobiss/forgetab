"use client"

import { useRef } from "react"
import { Plus } from "lucide-react"
import { useModalFocusTrap } from "@/shared/presentation/hooks/useModalFocusTrap"
import type {
  LibraryBookCreateModalModel,
  LibraryBookVisibility,
} from "./useLibrarySectionBooksController"
import styles from "./LibrarySectionBooksPage.module.css"

export function LibraryBookCreateModal({
  isOpen,
  title,
  description,
  visibility,
  error,
  saving,
  setTitle,
  setDescription,
  setVisibility,
  onCreate,
  onClose,
}: LibraryBookCreateModalModel) {
  const modalRef = useRef<HTMLElement | null>(null)
  useModalFocusTrap({
    isActive: isOpen,
    activeElement: modalRef,
    onEscape: () => onClose(),
  })

  if (!isOpen) return null

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Criar livro"
    >
      <section
        ref={modalRef}
        className={`${styles.modal} ${styles.createModal}`}
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Criar livro</h2>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onClose()}
            disabled={saving}
          >
            Fechar
          </button>
        </div>

        <label className={styles.field}>
          <span>Nome</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={2}
            maxLength={160}
            placeholder="Nome do livro"
            disabled={saving}
          />
        </label>

        <label className={styles.field}>
          <span>Descricao</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={280}
            rows={4}
            placeholder="Resumo curto do livro"
            disabled={saving}
          />
        </label>

        <label className={styles.field}>
          <span>Visibilidade</span>
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as LibraryBookVisibility)
            }
            disabled={saving}
          >
            <option value="private">Privada</option>
            <option value="public">Publica</option>
            <option value="unlisted">Por link</option>
          </select>
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void onCreate()}
            disabled={saving}
          >
            <Plus size={16} />
            <span>{saving ? "Criando..." : "Criar e abrir"}</span>
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onClose()}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
