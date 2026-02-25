"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import styles from "../page.module.css"

type ClassListItem = {
  id: string
  title: string
  subtitle: string
  href: string
  editHref?: string
}

type ClassGroup = {
  category: string
  items: ClassListItem[]
}

type Props = {
  groups: ClassGroup[]
  showEditActions?: boolean
}

export default function ClassCategoryToggleList({ groups, showEditActions = false }: Props) {
  const sortedGroups = useMemo(
    () => [...groups].sort((left, right) => left.category.localeCompare(right.category, "pt-BR")),
    [groups],
  )

  const [openCategory, setOpenCategory] = useState(sortedGroups[0]?.category ?? "")

  return (
    <>
      {sortedGroups.map((group) => {
        const isOpen = openCategory === group.category

        return (
          <section key={group.category} className={styles.categorySection}>
            <button
              type="button"
              className={styles.categoryToggleButton}
              onClick={() => setOpenCategory((current) => (current === group.category ? "" : group.category))}
              aria-expanded={isOpen}
            >
              <span className={styles.categoryTitle}>{group.category}</span>
              <span>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen ? (
              <div className={styles.grid}>
                {group.items.map((item) => (
                  <article key={item.id} className={styles.card}>
                    <Link className={styles.classLink} href={item.href}>
                      <h2>{item.title}</h2>
                      <p>{item.subtitle}</p>
                    </Link>

                    {showEditActions && item.editHref ? (
                      <div className={styles.cardActions}>
                        {item.editHref ? (
                          <Link className={styles.editButton} href={item.editHref}>
                            Editar
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {isOpen && group.items.length === 0 ? <p className={styles.emptyCategory}>Nenhuma classe nesta categoria.</p> : null}
          </section>
        )
      })}
    </>
  )
}
