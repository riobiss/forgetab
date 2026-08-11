import { Star } from "lucide-react"
import type { LibrarySectionDto } from "@/features/world/library/application/types"
import styles from "./LibrarySectionsPage.module.css"

type Props = {
  section: LibrarySectionDto
  favorite: boolean
  deleting: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

export function LibrarySectionCard(props: Props) {
  const { section } = props
  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={props.onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          props.onOpen()
        }
      }}
    >
      <button
        type="button"
        className={`${styles.favoriteFab} ${props.favorite ? styles.favoriteFabActive : ""}`}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          props.onToggleFavorite()
        }}
        aria-label={
          props.favorite
            ? `Remover ${section.title} dos favoritos`
            : `Adicionar ${section.title} aos favoritos`
        }
      >
        <Star size={16} fill={props.favorite ? "currentColor" : "none"} />
      </button>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{section.title}</h2>
      </div>
      <p className={styles.cardDescription}>
        {section.description || "Sem descricao cadastrada."}
      </p>
      <div className={styles.cardFooter}>
        <div className={styles.cardActions}>
          {section.canEdit ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={(event) => {
                event.stopPropagation()
                props.onEdit()
              }}
            >
              Editar
            </button>
          ) : null}
          {section.canDelete ? (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={(event) => {
                event.stopPropagation()
                props.onDelete()
              }}
              disabled={props.deleting}
            >
              {props.deleting ? "Apagando..." : "Apagar"}
            </button>
          ) : null}
        </div>
        <span className={styles.countBadge}>
          {section.booksCount ?? 0} livro(s)
        </span>
      </div>
    </article>
  )
}
