"use client"

import { useRef } from "react"
import { ReactMultiSelectField } from "@/components/select/ReactMultiSelectField"
import { useModalFocusTrap } from "@/shared/presentation/hooks/useModalFocusTrap"
import type {
  LibraryBookEditModalModel,
  LibraryBookVisibility
} from "./useLibrarySectionBooksController"
import styles from "./LibrarySectionBooksPage.module.css"

export function LibraryBookEditModal({
  isOpen,
  title,
  description,
  visibility,
  error,
  saving,
  playerOptions,
  raceOptions,
  classOptions,
  selectedPlayerOptions,
  selectedRaceOptions,
  selectedClassOptions,
  setTitle,
  setDescription,
  setVisibility,
  setAllowedUserIds,
  setAllowedRaceKeys,
  setAllowedClassKeys,
  onSave,
  onClose
}: LibraryBookEditModalModel) {
  const modalRef = useRef<HTMLElement | null>(null)
  useModalFocusTrap({
    isActive: isOpen,
    activeElement: modalRef,
    onEscape: () => onClose()
  })

  if (!isOpen) return null

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Editar livro"
    >
      <section ref={modalRef} className={styles.modal} tabIndex={-1}>
        <h2 className={styles.modalTitle}>Editar livro</h2>
        <label className={styles.field}>
          <span>Nome do livro</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={2}
            maxLength={160}
            required
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
        <label className={styles.field}>
          <span>Descricao basica</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={280}
            rows={4}
            placeholder="Resumo curto do livro"
            disabled={saving}
          />
        </label>

        {visibility === "private" ? (
          <>
            <label className={styles.field}>
              <span>Players permitidos</span>
              <ReactMultiSelectField
                options={playerOptions}
                value={selectedPlayerOptions}
                onChange={(options) =>
                  setAllowedUserIds(options.map((item) => item.value))
                }
                isDisabled={saving}
                placeholder="Selecione usuarios do RPG"
              />
            </label>
            {raceOptions.length > 0 ? (
              <label className={styles.field}>
                <span>Racas permitidas</span>
                <ReactMultiSelectField
                  options={raceOptions}
                  value={selectedRaceOptions}
                  onChange={(options) =>
                    setAllowedRaceKeys(options.map((item) => item.value))
                  }
                  isDisabled={saving}
                  placeholder="Selecione racas"
                />
              </label>
            ) : null}
            {classOptions.length > 0 ? (
              <label className={styles.field}>
                <span>Classes permitidas</span>
                <ReactMultiSelectField
                  options={classOptions}
                  value={selectedClassOptions}
                  onChange={(options) =>
                    setAllowedClassKeys(options.map((item) => item.value))
                  }
                  isDisabled={saving}
                  placeholder="Selecione classes"
                />
              </label>
            ) : null}
          </>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void onSave()}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
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
