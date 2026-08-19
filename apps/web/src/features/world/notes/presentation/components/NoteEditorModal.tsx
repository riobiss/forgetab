import {
  Copy,
  LoaderCircle,
  MoreVertical,
  Plus,
  Save,
  Tag,
  Trash2,
  X
} from "lucide-react"
import { useLayoutEffect, useRef } from "react"
import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  type Note,
  type NoteLabel
} from "@/features/world/notes/domain/Note"
import type { SyncedNote as LocalNote } from "@/features/world/notes/application/models/SyncedNote"
import styles from "../LocalNotesPage.module.css"

type NoteEditorModalProps = {
  note: LocalNote
  labels: NoteLabel[]
  isSaving: boolean
  isActing: boolean
  menuOpen: boolean
  labelPickerOpen: boolean
  onChange: (patch: Partial<Pick<Note, "title" | "content">>) => void
  onSave: () => void
  onClose: () => void
  onToggleMenu: () => void
  onOpenLabelPicker: () => void
  onCloseLabelPicker: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleLabel: (label: NoteLabel) => void
  onCreateLabel: () => void
}

function syncStatusLabel(note: LocalNote) {
  if (note.isNew && note.localVersion === 0) return "Nova nota"
  if (note.syncStatus === "saved") return "Salvo"
  if (note.syncStatus === "offline") return "Offline"
  if (note.syncStatus === "error") return "Erro ao salvar"
  return "Salvando..."
}

export function NoteEditorModal({
  note,
  labels,
  isSaving,
  isActing,
  menuOpen,
  labelPickerOpen,
  onChange,
  onSave,
  onClose,
  onToggleMenu,
  onOpenLabelPicker,
  onCloseLabelPicker,
  onDuplicate,
  onDelete,
  onToggleLabel,
  onCreateLabel
}: NoteEditorModalProps) {
  const modalRef = useRef<HTMLElement | null>(null)
  const headerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const footerRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const modal = modalRef.current
    const header = headerRef.current
    const textarea = contentRef.current
    const footer = footerRef.current
    if (!modal || !header || !textarea || !footer) return

    const resizeToContent = () => {
      const modalStyles = window.getComputedStyle(modal)
      const textareaStyles = window.getComputedStyle(textarea)
      const parsedModalMaxHeight = Number.parseFloat(modalStyles.maxHeight)
      const visibleViewportHeight =
        window.visualViewport?.height ?? window.innerHeight
      const viewportMaxHeight = Math.max(160, visibleViewportHeight - 72 - 16)
      const modalMaxHeight = Number.isFinite(parsedModalMaxHeight)
        ? Math.min(parsedModalMaxHeight, viewportMaxHeight)
        : viewportMaxHeight
      const borderHeight =
        Number.parseFloat(modalStyles.borderTopWidth) +
        Number.parseFloat(modalStyles.borderBottomWidth)
      const parsedMinimumTextareaHeight = Number.parseFloat(
        textareaStyles.minHeight
      )
      const minimumTextareaHeight = Number.isFinite(parsedMinimumTextareaHeight)
        ? parsedMinimumTextareaHeight
        : 80
      const availableHeight = Math.max(
        minimumTextareaHeight,
        modalMaxHeight -
          header.offsetHeight -
          footer.offsetHeight -
          borderHeight
      )

      textarea.style.maxHeight = `${availableHeight}px`
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        availableHeight
      )}px`
      textarea.style.overflowY =
        textarea.scrollHeight > availableHeight ? "auto" : "hidden"
    }

    resizeToContent()
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(resizeToContent)
    observer?.observe(header)
    observer?.observe(footer)
    window.addEventListener("resize", resizeToContent)
    window.visualViewport?.addEventListener("resize", resizeToContent)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", resizeToContent)
      window.visualViewport?.removeEventListener("resize", resizeToContent)
    }
  }, [note.content])

  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={modalRef}
        className={styles.noteModal}
        role="dialog"
        aria-modal="true"
        aria-label="Editar nota"
      >
        <header ref={headerRef} className={styles.modalHeader}>
          <input
            autoFocus
            value={note.title}
            maxLength={NOTE_TITLE_MAX_LENGTH}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Título"
            aria-label="Título da nota"
          />
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || note.syncStatus === "saved"}
              aria-label="Salvar nota"
            >
              {isSaving ? (
                <LoaderCircle className={styles.spin} size={19} />
              ) : (
                <Save size={19} />
              )}
            </button>
            <div className={styles.menuAnchor}>
              <button
                type="button"
                onClick={onToggleMenu}
                aria-label="Mais opções"
              >
                <MoreVertical size={20} />
              </button>
              {menuOpen ? (
                <div className={styles.menu}>
                  <button type="button" onClick={onOpenLabelPicker}>
                    <Tag size={16} /> Adicionar marcador
                  </button>
                  <button
                    type="button"
                    onClick={onDuplicate}
                    disabled={isActing}
                  >
                    <Copy size={16} /> Fazer uma cópia
                  </button>
                  <button
                    type="button"
                    className={styles.dangerAction}
                    onClick={onDelete}
                    disabled={isActing}
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              ) : null}
              {labelPickerOpen ? (
                <div className={`${styles.menu} ${styles.labelPicker}`}>
                  <strong>Adicionar marcador</strong>
                  {labels.length === 0 ? (
                    <p>Nenhum marcador criado.</p>
                  ) : (
                    labels.map((label) => (
                      <label key={label.id}>
                        <input
                          type="checkbox"
                          checked={note.labels.some(
                            (item) => item.id === label.id
                          )}
                          onChange={() => onToggleLabel(label)}
                        />
                        <span>{label.name}</span>
                      </label>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onCloseLabelPicker()
                      onCreateLabel()
                    }}
                  >
                    <Plus size={15} /> Criar marcador
                  </button>
                </div>
              ) : null}
            </div>
            <button type="button" onClick={onClose} aria-label="Sair da nota">
              <X size={21} />
            </button>
          </div>
        </header>

        <textarea
          ref={contentRef}
          rows={1}
          value={note.content}
          maxLength={NOTE_CONTENT_MAX_LENGTH}
          onChange={(event) => onChange({ content: event.target.value })}
          placeholder="Escreva sua nota..."
          aria-label="Texto completo da nota"
        />

        <footer ref={footerRef} className={styles.modalFooter}>
          <div className={styles.chips}>
            {note.labels.map((label) => (
              <button
                type="button"
                key={label.id}
                onClick={() => onToggleLabel(label)}
              >
                {label.name} <X size={12} />
              </button>
            ))}
          </div>
          <span data-status={note.syncStatus}>{syncStatusLabel(note)}</span>
        </footer>
      </section>
    </div>
  )
}
