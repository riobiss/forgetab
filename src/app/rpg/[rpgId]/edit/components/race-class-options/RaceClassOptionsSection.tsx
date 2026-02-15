"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import styles from "./RaceClassOptionsSection.module.css"
import type { IdentityTemplate } from "../shared/types"

type Props = {
  rpgId: string
  useClassRaceBonuses: boolean
  onUseClassRaceBonusesChange: (value: boolean) => void
  showRaceList: boolean
  onToggleRaceList: () => void
  onCreateRace: () => void
  raceDrafts: IdentityTemplate[]
  showClassList: boolean
  onToggleClassList: () => void
  onCreateClass: () => void
  classDrafts: IdentityTemplate[]
}

export default function RaceClassOptionsSection({
  rpgId,
  useClassRaceBonuses,
  onUseClassRaceBonusesChange,
  showRaceList,
  onToggleRaceList,
  onCreateRace,
  raceDrafts,
  showClassList,
  onToggleClassList,
  onCreateClass,
  classDrafts,
}: Props) {
  return (
    <>
      <div className={styles.section}>
        <h3>Racas e Classes</h3>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={useClassRaceBonuses}
            onChange={(event) => onUseClassRaceBonusesChange(event.target.checked)}
          />
          <span>Usar racas/classes na criacao de personagem</span>
        </label>
      </div>

      {useClassRaceBonuses ? (
        <>
          <div className={styles.section}>
            <h3>Racas</h3>
            <div className={styles.headerActions}>
              <button type="button" onClick={onToggleRaceList}>
                {showRaceList ? "Ocultar nomes" : "Mostrar nomes"}
              </button>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.iconOnlyButton}`}
                aria-label="Criar nova raca"
                title="Criar nova raca"
                onClick={onCreateRace}
              >
                <Plus size={16} />
              </button>
            </div>

            {showRaceList ? (
              <ul className={styles.list}>
                {raceDrafts.length === 0 ? <li>Nenhuma raca cadastrada.</li> : null}
                {raceDrafts.map((draft) => (
                  <li key={draft.key} className={styles.listItem}>
                    <span>{draft.label.trim() || "Sem nome"}</span>
                    <div className={styles.itemActions}>
                      <Link
                        className={styles.secondaryButton}
                        href={`/rpg/${rpgId}/edit/advanced/race/${draft.key}`}
                      >
                        Avancado
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={styles.section}>
            <h3>Classes</h3>
            <div className={styles.headerActions}>
              <button type="button" onClick={onToggleClassList}>
                {showClassList ? "Ocultar nomes" : "Mostrar nomes"}
              </button>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.iconOnlyButton}`}
                aria-label="Criar nova classe"
                title="Criar nova classe"
                onClick={onCreateClass}
              >
                <Plus size={16} />
              </button>
            </div>

            {showClassList ? (
              <ul className={styles.list}>
                {classDrafts.length === 0 ? <li>Nenhuma classe cadastrada.</li> : null}
                {classDrafts.map((draft) => (
                  <li key={draft.key} className={styles.listItem}>
                    <span>{draft.label.trim() || "Sem nome"}</span>
                    <div className={styles.itemActions}>
                      <Link
                        className={styles.secondaryButton}
                        href={`/rpg/${rpgId}/edit/advanced/class/${draft.key}`}
                      >
                        Avancado
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  )
}
