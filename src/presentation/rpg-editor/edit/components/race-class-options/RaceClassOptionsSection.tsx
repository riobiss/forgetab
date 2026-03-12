"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { ChevronDown, ChevronUp, Plus, Settings2, Trash2 } from "lucide-react"
import type { RpgEditorDependencies } from "@/application/rpgEditor/contracts/RpgEditorDependencies"
import {
  saveRpgClassesUseCase,
  saveRpgRacesUseCase,
} from "@/application/rpgEditor/use-cases/rpgEditor"
import styles from "./RaceClassOptionsSection.module.css"
import type { IdentityTemplate } from "../shared/types"

type Props = {
  deps: RpgEditorDependencies
  rpgId: string
  showRaceList: boolean
  onToggleRaceList: () => void
  onCreateRace: () => void
  raceDrafts: IdentityTemplate[]
  onRaceDraftsChange: (next: IdentityTemplate[]) => void
  showClassList: boolean
  onToggleClassList: () => void
  onCreateClass: () => void
  classDrafts: IdentityTemplate[]
  onClassDraftsChange: (next: IdentityTemplate[]) => void
}

export default function RaceClassOptionsSection({
  deps,
  rpgId,
  showRaceList,
  onToggleRaceList,
  onCreateRace,
  raceDrafts,
  onRaceDraftsChange,
  showClassList,
  onToggleClassList,
  onCreateClass,
  classDrafts,
  onClassDraftsChange,
}: Props) {
  const [deletingRaceKey, setDeletingRaceKey] = useState("")
  const [deletingClassKey, setDeletingClassKey] = useState("")
  const [feedback, setFeedback] = useState("")

  async function deleteRace(key: string) {
    const target = raceDrafts.find((item) => item.key === key)
    if (!target) return

    const confirmed = window.confirm(`Excluir a raca "${target.label}"?`)
    if (!confirmed) return

    const nextRaces = raceDrafts.filter((item) => item.key !== key)
    setDeletingRaceKey(key)
    setFeedback("")

    try {
      await saveRpgRacesUseCase(deps, {
        rpgId,
        races: nextRaces.map((item) => ({
          key: item.key,
          label: item.label,
          category: item.category,
          attributeBonuses: item.attributeBonuses,
          skillBonuses: item.skillBonuses,
          lore: item.lore,
          catalogMeta: item.catalogMeta,
          position: item.position,
        })),
      })
      onRaceDraftsChange(nextRaces)
      setFeedback("Raca excluida com sucesso.")
      toast.success("Raca excluida com sucesso.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro de conexao ao excluir raca."
      setFeedback(message)
      toast.error(message)
    } finally {
      setDeletingRaceKey("")
    }
  }

  async function deleteClass(key: string) {
    const target = classDrafts.find((item) => item.key === key)
    if (!target) return

    const confirmed = window.confirm(`Excluir a classe "${target.label}"?`)
    if (!confirmed) return

    const nextClasses = classDrafts.filter((item) => item.key !== key)
    setDeletingClassKey(key)
    setFeedback("")

    try {
      await saveRpgClassesUseCase(deps, {
        rpgId,
        classes: nextClasses.map((item) => ({
          key: item.key,
          label: item.label,
          category: item.category,
          attributeBonuses: item.attributeBonuses,
          skillBonuses: item.skillBonuses,
          catalogMeta: item.catalogMeta,
          position: item.position,
        })),
      })
      onClassDraftsChange(nextClasses)
      setFeedback("Classe excluida com sucesso.")
      toast.success("Classe excluida com sucesso.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro de conexao ao excluir classe."
      setFeedback(message)
      toast.error(message)
    } finally {
      setDeletingClassKey("")
    }
  }

  return (
    <>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}

      <div className={styles.section}>
        <h3>Racas</h3>
        <div className={styles.headerActions}>
          <button type="button" onClick={onToggleRaceList}>
            {showRaceList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
                    <Settings2 size={14} />
                    Avancado
                  </Link>
                  <button
                    type="button"
                    className={`${styles.secondaryButton} ${styles.dangerButton}`}
                    onClick={() => void deleteRace(draft.key)}
                    disabled={deletingRaceKey === draft.key}
                  >
                    <Trash2 size={14} />
                    <span>
                      {deletingRaceKey === draft.key ? "Excluindo..." : "Excluir"}
                    </span>
                  </button>
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
            {showClassList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
                    <Settings2 size={14} />
                    Avancado
                  </Link>
                  <button
                    type="button"
                    className={`${styles.secondaryButton} ${styles.dangerButton}`}
                    onClick={() => void deleteClass(draft.key)}
                    disabled={deletingClassKey === draft.key}
                  >
                    <Trash2 size={14} />
                    <span>
                      {deletingClassKey === draft.key ? "Excluindo..." : "Excluir"}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  )
}
