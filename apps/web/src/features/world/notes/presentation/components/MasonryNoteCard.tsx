"use client"

import { Copy, MoreVertical, Tag, Trash2 } from "lucide-react"
import { useLayoutEffect, useRef } from "react"
import type { SyncedNote as LocalNote } from "@/features/world/notes/application/models/SyncedNote"
import styles from "../LocalNotesPage.module.css"

const PREVIEW_MAX_LENGTH = 400
const MASONRY_VERTICAL_GAP_PX = 16

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
}

function previewText(content: string) {
  if (content.length <= PREVIEW_MAX_LENGTH) return content
  return `${content.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`
}

export type MasonryNoteCardProps = {
  note: LocalNote
  menuDisabled: boolean
  onOpen: (note: LocalNote) => void
  onAddLabel: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function MasonryNoteCard({
  note,
  menuDisabled,
  onOpen,
  onAddLabel,
  onDuplicate,
  onDelete
}: MasonryNoteCardProps) {
  const cardRef = useRef<HTMLElement | null>(null)
  const menuRef = useRef<HTMLDetailsElement | null>(null)

  function runMenuAction(action: () => void) {
    menuRef.current?.removeAttribute("open")
    action()
  }

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return

    const updateSpan = () => {
      const height = Math.ceil(card.getBoundingClientRect().height)
      const span = Math.max(1, height + MASONRY_VERTICAL_GAP_PX)
      const nextValue = `span ${span}`
      if (card.style.gridRowEnd !== nextValue) {
        card.style.gridRowEnd = nextValue
      }
    }

    updateSpan()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSpan)
      return () => window.removeEventListener("resize", updateSpan)
    }

    const observer = new ResizeObserver(updateSpan)
    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  return (
    <article
      ref={cardRef}
      className={styles.noteCard}
      onClick={() => onOpen(note)}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        onOpen(note)
      }}
    >
      {note.title.trim() ? <h2>{note.title}</h2> : null}
      {note.content ? <p>{previewText(note.content)}</p> : null}
      {note.labels.length ? (
        <div className={styles.chips}>
          {note.labels.map((label) => (
            <span key={label.id}>{label.name}</span>
          ))}
        </div>
      ) : null}
      <footer>
        <time dateTime={note.updatedAt}>{formatUpdatedAt(note.updatedAt)}</time>
        <details
          ref={menuRef}
          className={styles.previewMenuAnchor}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <summary
            aria-label={`Mais opções para ${note.title || "nota sem título"}`}
          >
            <MoreVertical size={17} />
          </summary>
          <div className={`${styles.menu} ${styles.previewMenu}`}>
            <button type="button" onClick={() => runMenuAction(onAddLabel)}>
              <Tag size={16} /> Adicionar marcador
            </button>
            <button
              type="button"
              onClick={() => runMenuAction(onDuplicate)}
              disabled={menuDisabled}
            >
              <Copy size={16} /> Fazer uma cópia
            </button>
            <button
              type="button"
              className={styles.dangerAction}
              onClick={() => runMenuAction(onDelete)}
              disabled={menuDisabled}
            >
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        </details>
      </footer>
    </article>
  )
}
