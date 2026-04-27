"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Pencil, Plus, Search, Settings } from "lucide-react"
import type { CharactersDashboardViewModel } from "@/application/charactersDashboard/types"
import styles from "./CreaturePages.module.css"

type Props = {
  data: CharactersDashboardViewModel
}

export default function CreaturesDashboardPage({ data }: Props) {
  const [search, setSearch] = useState("")

  const visibleCreatures = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const onlyCreatures = data.characters.filter((character) => character.characterType === "creature")

    if (!normalizedSearch) {
      return onlyCreatures
    }

    return onlyCreatures.filter((character) =>
      character.name.trim().toLowerCase().includes(normalizedSearch),
    )
  }, [data.characters, search])

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
          <span>{visibleCreatures.length} resultado{visibleCreatures.length === 1 ? "" : "s"}</span>
        </div>
      </section>

      {!data.canManageNpcCreature ? (
        <section className={styles.emptyState}>
          <h2>Acesso restrito</h2>
          <p className={styles.helper}>
            Somente owner e moderador podem acessar a configuracao de criaturas deste RPG.
          </p>
        </section>
      ) : visibleCreatures.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>Nenhuma criatura encontrada</h2>
          <p>Troque a busca atual ou crie uma nova criatura para preencher este catalogo.</p>
        </section>
      ) : (
        <section className={styles.dbSection}>
          <div className={styles.cardGrid}>
            {visibleCreatures.map((creature) => (
              <article key={creature.id} className={styles.card}>
                <Link
                  href={`/rpg/${data.rpgId}/creatures/${creature.id}/edit`}
                  className={styles.editFab}
                  aria-label={`Editar ${creature.name}`}
                  title={`Editar ${creature.name}`}
                >
                  <Pencil size={16} />
                </Link>
                <Link className={styles.cardLink} href={`/rpg/${data.rpgId}/creatures/${creature.id}`}>
                  {creature.image ? (
                    <Image
                      src={creature.image}
                      alt={creature.name}
                      fill
                      className={styles.cardImage}
                      priority
                      sizes="(max-width: 1099px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={styles.imageFallback} aria-hidden="true" />
                  )}
                  <div className={styles.overlay}>
                    <h2 className={styles.cardTitle}>{creature.name}</h2>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
