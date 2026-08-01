"use client"

import Link from "next/link"
import { ChevronDown, ChevronUp, Pencil } from "lucide-react"
import type { EntityCatalogGroup } from "@/features/world/catalog/application/types"
import { getCatalogMetaExcerpt } from "@/features/world/catalog/domain/catalogMeta"
import styles from "./EntityCatalogClient.module.css"

type Props = {
  groups: EntityCatalogGroup[]
  collapsedGroups: Record<string, boolean>
  canManage: boolean
  onToggleGroup(groupKey: string): void
  onManageCategory(category: string): void
}

export default function EntityCatalogGroups({
  groups,
  collapsedGroups,
  canManage,
  onToggleGroup,
  onManageCategory,
}: Props) {
  if (groups.length === 0) {
    return (
      <section className={styles.emptyState}>
        Nenhum item encontrado com os filtros atuais.
      </section>
    )
  }

  return (
    <section className={styles.groups}>
      {groups.map((group) => {
        const collapsed = collapsedGroups[group.key]

        return (
          <article key={group.key} className={styles.group}>
            <div className={styles.groupHeader}>
              <button
                type="button"
                className={styles.groupToggle}
                onClick={() => onToggleGroup(group.key)}
                aria-expanded={!collapsed}
              >
                <div className={styles.groupHeaderInfo}>
                  <h2 className={styles.groupTitle}>{group.label}</h2>
                </div>

                <div className={styles.toolbar}>
                  <span className={styles.groupBadge}>{group.count}</span>
                  {collapsed ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronUp size={18} />
                  )}
                </div>
              </button>

              {canManage ? (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => onManageCategory(group.label)}
                  aria-label={`Gerenciar categoria ${group.label}`}
                  title="Gerenciar categoria"
                >
                  <Pencil size={14} />
                </button>
              ) : null}
            </div>

            {!collapsed ? (
              <div className={styles.groupContent}>
                <div className={styles.grid}>
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={styles.card}
                    >
                      <div className={styles.cardBody}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderTop}>
                            <h3 className={styles.cardTitle}>{item.name}</h3>
                          </div>
                        </div>

                        <p
                          className={`${styles.description} ${styles.cardDescription}`}
                        >
                          {getCatalogMetaExcerpt(item.meta) ?? ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}
