"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Filter,
  Pencil,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react"
import type {
  CharacterDashboardCardDto,
  CharactersDashboardViewModel,
} from "@/application/charactersDashboard/types"
import styles from "./CreaturePages.module.css"

type Props = {
  data: CharactersDashboardViewModel
}

type CreatureSort = "name-asc" | "name-desc" | "category-asc"

type CreatureGroup = {
  key: string
  label: string
  count: number
  items: CharacterDashboardCardDto[]
}

const SORT_OPTIONS: Array<{ value: CreatureSort; label: string }> = [
  { value: "name-asc", label: "Nome A-Z" },
  { value: "name-desc", label: "Nome Z-A" },
  { value: "category-asc", label: "Categoria" },
]

function normalizeCategory(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : "geral"
}

function compareByName(a: CharacterDashboardCardDto, b: CharacterDashboardCardDto) {
  return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
}

export default function CreaturesDashboardPage({ data }: Props) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState<CreatureSort>("name-asc")
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const creatureItems = useMemo(
    () => data.characters.filter((character) => character.characterType === "creature"),
    [data.characters],
  )

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(creatureItems.map((creature) => normalizeCategory(creature.category))))
        .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })),
    [creatureItems],
  )

  const groups = useMemo<CreatureGroup[]>(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = creatureItems.filter((creature) => {
      const creatureCategory = normalizeCategory(creature.category)
      const matchesSearch =
        !normalizedSearch ||
        creature.name.trim().toLowerCase().includes(normalizedSearch) ||
        creatureCategory.toLowerCase().includes(normalizedSearch)
      const matchesCategory = category === "all" || creatureCategory === category
      return matchesSearch && matchesCategory
    })

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "name-desc") {
        return compareByName(b, a)
      }

      const categoryComparison = normalizeCategory(a.category).localeCompare(
        normalizeCategory(b.category),
        "pt-BR",
        { sensitivity: "base" },
      )

      if (sort === "category-asc" && categoryComparison !== 0) {
        return categoryComparison
      }

      return compareByName(a, b)
    })

    const grouped = sorted.reduce<Map<string, CharacterDashboardCardDto[]>>((acc, creature) => {
      const creatureCategory = normalizeCategory(creature.category)
      const current = acc.get(creatureCategory) ?? []
      current.push(creature)
      acc.set(creatureCategory, current)
      return acc
    }, new Map())

    return Array.from(grouped.entries()).map(([groupCategory, items]) => ({
      key: groupCategory,
      label: groupCategory,
      count: items.length,
      items,
    }))
  }, [category, creatureItems, search, sort])

  const visibleCount = groups.reduce((acc, group) => acc + group.count, 0)

  useEffect(() => {
    setCollapsedGroups((current) =>
      groups.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.key] = current[group.key] ?? true
        return acc
      }, {}),
    )
  }, [groups])

  function toggleGroup(groupKey: string) {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }))
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.topbar}>
          <div className={styles.titleRow}>
            <div className={styles.titleBlock}>
              <p className={styles.kicker}>{data.rpgName}</p>
              <h1 className={styles.title}>Criaturas</h1>
            </div>
            {data.canManageNpcCreature ? (
              <div className={styles.titleActions}>
                <button
                  type="button"
                  className={category !== "all" ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                  onClick={() => setCategoryDrawerOpen(true)}
                  aria-label="Filtrar por categoria"
                  title="Categorias"
                >
                  <Filter size={18} />
                </button>
                <button
                  type="button"
                  className={sortModalOpen || sort !== "name-asc" ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                  onClick={() => setSortModalOpen(true)}
                  aria-label="Ordenar criaturas"
                  title="Ordenacao"
                >
                  <ArrowUpDown size={18} />
                </button>
                <Link
                  href={`/rpg/${data.rpgId}/creatures/config`}
                  className={styles.iconButton}
                  aria-label="Configurar criaturas"
                  title="Configurar criaturas"
                >
                  <Settings size={18} />
                </Link>
                <Link
                  href={`/rpg/${data.rpgId}/creatures/new`}
                  className={`${styles.iconButton} ${styles.createButton}`}
                  aria-label="Criar criatura"
                  title="Criar criatura"
                >
                  <Plus size={18} />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.searchActionsRow}>
          <div className={styles.searchActionsInner}>
            <label className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar criatura"
                aria-label="Buscar criatura"
              />
            </label>
          </div>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.resultsMeta}>
          <span>{visibleCount} resultado{visibleCount === 1 ? "" : "s"}</span>
        </div>
      </section>

      {!data.canManageNpcCreature ? (
        <section className={styles.emptyState}>
          <h2>Acesso restrito</h2>
          <p className={styles.helper}>
            Somente owner e moderador podem acessar a configuracao de criaturas deste RPG.
          </p>
        </section>
      ) : groups.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>Nenhuma criatura encontrada</h2>
          <p>Troque a busca atual ou crie uma nova criatura para preencher este catalogo.</p>
        </section>
      ) : (
        <section className={styles.groups}>
          {groups.map((group) => {
            const collapsed = collapsedGroups[group.key]
            return (
              <article key={group.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <button
                    type="button"
                    className={styles.groupHeaderToggle}
                    onClick={() => toggleGroup(group.key)}
                  >
                    <div className={styles.groupHeaderInfo}>
                      <h2 className={styles.groupTitle}>{group.label}</h2>
                    </div>
                    <div className={styles.groupHeaderActions}>
                      <span className={styles.groupBadge}>{group.count}</span>
                      {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                  </button>

                  <Link
                    href={`/rpg/${data.rpgId}/creatures/config`}
                    className={styles.groupManageButton}
                    aria-label={`Configurar grupo ${group.label}`}
                    title="Configurar grupos"
                  >
                    <Pencil size={14} />
                  </Link>
                </div>

                {!collapsed ? (
                  <div className={styles.groupContent}>
                    <div className={styles.creatureListGrid}>
                      {group.items.map((creature) => (
                        <article key={creature.id} className={styles.listCard}>
                          <Link className={styles.listCardLink} href={`/rpg/${data.rpgId}/creatures/${creature.id}`}>
                            <div className={styles.listImageFrame}>
                              {creature.image ? (
                                <Image
                                  src={creature.image}
                                  alt={creature.name}
                                  fill
                                  className={styles.listCardImage}
                                  sizes="72px"
                                />
                              ) : (
                                <div className={styles.imageFallback} aria-hidden="true" />
                              )}
                            </div>
                            <div className={styles.listCardBody}>
                              <h3 className={styles.listCardTitle}>{creature.name}</h3>
                              <span className={styles.cardCategory}>{normalizeCategory(creature.category)}</span>
                            </div>
                          </Link>
                          <Link
                            href={`/rpg/${data.rpgId}/creatures/${creature.id}/edit`}
                            className={styles.listEditButton}
                            aria-label={`Editar ${creature.name}`}
                            title={`Editar ${creature.name}`}
                          >
                            <Pencil size={15} />
                          </Link>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>
      )}

      {categoryDrawerOpen ? (
        <>
          <button
            type="button"
            className={styles.drawerBackdrop}
            aria-label="Fechar categorias"
            onClick={() => setCategoryDrawerOpen(false)}
          />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Categorias">
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Categorias</h3>
              <button type="button" className={styles.drawerClose} onClick={() => setCategoryDrawerOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.chipsRow}>
              <button
                type="button"
                className={category === "all" ? `${styles.chipButton} ${styles.chipButtonActive}` : styles.chipButton}
                onClick={() => {
                  setCategory("all")
                  setCategoryDrawerOpen(false)
                }}
              >
                Todas
              </button>
              {categoryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={category === option ? `${styles.chipButton} ${styles.chipButtonActive}` : styles.chipButton}
                  onClick={() => {
                    setCategory(option)
                    setCategoryDrawerOpen(false)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.drawerClear}
              onClick={() => {
                setCategory("all")
                setCategoryDrawerOpen(false)
              }}
            >
              Limpar filtro
            </button>
          </aside>
        </>
      ) : null}

      {sortModalOpen ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" onClick={() => setSortModalOpen(false)}>
          <section className={styles.sortModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.simpleModalTitle}>Ordenacao</h2>
              <button type="button" className={styles.drawerClose} onClick={() => setSortModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.sortOptions}>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={sort === option.value ? `${styles.sortOption} ${styles.sortOptionActive}` : styles.sortOption}
                  onClick={() => {
                    setSort(option.value)
                    setSortModalOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
