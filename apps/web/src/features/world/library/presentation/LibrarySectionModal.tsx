import type { LibrarySectionsModalModel } from "./useLibrarySectionsController"
import styles from "./LibrarySectionsPage.module.css"

export function LibrarySectionModal({
  modal
}: {
  modal: LibrarySectionsModalModel
}) {
  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={modal.editingId ? "Editar secao" : "Criar secao"}
    >
      <section className={styles.modal}>
        <form className={styles.form} onSubmit={modal.submit}>
          <label className={styles.field}>
            <span>{modal.editingId ? "Editar sessao" : "Nova sessao"}</span>
            <input
              type="text"
              value={modal.title}
              onChange={(event) => modal.setTitle(event.target.value)}
              minLength={2}
              maxLength={120}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Descricao</span>
            <textarea
              value={modal.description}
              onChange={(event) => modal.setDescription(event.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Opcional"
            />
          </label>
          <label className={styles.field}>
            <span>Privacidade</span>
            <select
              value={modal.visibility}
              onChange={(event) =>
                modal.setVisibility(event.target.value as "private" | "public")
              }
            >
              <option value="public">Publica</option>
              <option value="private">Privada</option>
            </select>
          </label>
          {modal.submitError ? (
            <p className={styles.error}>{modal.submitError}</p>
          ) : null}
          <div className={styles.headerActions}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={modal.saving}
            >
              {modal.saving
                ? "Salvando..."
                : modal.editingId
                  ? "Salvar edicao"
                  : "Adicionar sessao"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={modal.close}
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
