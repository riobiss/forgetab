import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react"
import type { RefObject } from "react"
import type { NoteLabel } from "@/features/world/notes/domain/Note"
import styles from "../LocalNotesPage.module.css"

type LabelsEditorModalProps = {
  labels: NoteLabel[]
  inputRef: RefObject<HTMLInputElement | null>
  newLabelName: string
  editingLabelId: string | null
  editingLabelName: string
  isActing: boolean
  onClose: () => void
  onNewLabelNameChange: (name: string) => void
  onEditingLabelNameChange: (name: string) => void
  onStartEditing: (label: NoteLabel) => void
  onCreate: () => void
  onRename: () => void
  onDelete: (label: NoteLabel) => void
}

export function LabelsEditorModal({
  labels,
  inputRef,
  newLabelName,
  editingLabelId,
  editingLabelName,
  isActing,
  onClose,
  onNewLabelNameChange,
  onEditingLabelNameChange,
  onStartEditing,
  onCreate,
  onRename,
  onDelete
}: LabelsEditorModalProps) {
  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className={styles.labelModal}
        role="dialog"
        aria-modal="true"
        aria-label="Editar marcadores"
      >
        <header>
          <h2>Editar marcadores</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        <div className={styles.newLabelRow}>
          <Plus size={18} />
          <input
            ref={inputRef}
            value={newLabelName}
            maxLength={50}
            onChange={(event) => onNewLabelNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCreate()
            }}
            placeholder="Criar novo marcador"
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={!newLabelName.trim() || isActing}
          >
            <Check size={18} />
          </button>
        </div>
        <div className={styles.labelRows}>
          {labels.map((label) => (
            <div key={label.id}>
              <Tag size={17} />
              {editingLabelId === label.id ? (
                <input
                  autoFocus
                  value={editingLabelName}
                  maxLength={50}
                  onChange={(event) =>
                    onEditingLabelNameChange(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onRename()
                  }}
                />
              ) : (
                <span>{label.name}</span>
              )}
              {editingLabelId === label.id ? (
                <button type="button" onClick={onRename}>
                  <Check size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartEditing(label)}
                  aria-label={`Editar ${label.name}`}
                >
                  <Pencil size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(label)}
                aria-label={`Excluir ${label.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
