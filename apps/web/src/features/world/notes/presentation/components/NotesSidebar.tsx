import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  NotebookText,
  Pencil,
  Plus,
  Tag
} from "lucide-react"
import type { NoteLabel } from "@/features/world/notes/domain/Note"
import { resolveNotesReturnPath } from "../notesNavigation"
import styles from "../LocalNotesPage.module.css"

type NotesSidebarProps = {
  rpgId: string
  returnPath?: string
  notesCount: number
  labels: NoteLabel[]
  activeLabelId: string | null
  collapsed: boolean
  onSelectLabel: (labelId: string | null) => void
  onOpenLabelEditor: () => void
}

export function NotesSidebar({
  rpgId,
  returnPath,
  notesCount,
  labels,
  activeLabelId,
  collapsed,
  onSelectLabel,
  onOpenLabelEditor
}: NotesSidebarProps) {
  return (
    <aside
      id="notes-sidebar"
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      aria-label="Navegacao das notas"
    >
      <div className={styles.brand}>
        <Link
          href={resolveNotesReturnPath(rpgId, returnPath)}
          className={styles.iconButton}
          aria-label="Voltar"
        >
          <ArrowLeft size={19} />
        </Link>
        <NotebookText size={24} />
        <strong>Notas</strong>
      </div>

      <nav className={styles.navList}>
        <button
          type="button"
          aria-label="Notas"
          className={!activeLabelId ? styles.navItemActive : undefined}
          onClick={() => onSelectLabel(null)}
        >
          <FileText size={19} />
          <span>Notas</span>
          <small>{notesCount}</small>
        </button>

        <div className={styles.navHeading}>
          <span>Marcadores</span>
          <button
            type="button"
            onClick={onOpenLabelEditor}
            aria-label="Criar marcador"
          >
            <Plus size={17} />
          </button>
        </div>

        {labels.map((label) => (
          <button
            type="button"
            key={label.id}
            aria-label={label.name}
            className={
              activeLabelId === label.id ? styles.navItemActive : undefined
            }
            onClick={() => onSelectLabel(label.id)}
          >
            <Tag size={18} />
            <span>{label.name}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={onOpenLabelEditor}
          aria-label="Editar marcadores"
        >
          <Pencil size={18} />
          <span>Editar marcadores</span>
        </button>
      </nav>
    </aside>
  )
}
