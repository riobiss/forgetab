"use client"

import { useMemo, useState } from "react"
import styles from "./page.module.css"

const SKILL_CATEGORY_LABEL: Record<string, string> = {
  attack: "Ataque",
  burst: "Explosao",
  support: "Suporte",
  buff: "Buff",
  debuff: "Debuff",
  control: "Controle",
  defense: "Defesa",
  mobility: "Mobilidade",
  summon: "Invocacao",
  utility: "Utilidade",
  resource: "Recurso",
}

const SKILL_TYPE_LABEL: Record<string, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

type SkillLevelView = {
  levelNumber: number
  levelRequired: number
  upgradeFromLevelNumber: number | null
  levelName: string | null
  levelDescription: string | null
  notes: string | null
  notesList: string[]
  description: string | null
  summary: string | null
  damage: string | null
  range: string | null
  cooldown: string | null
  duration: string | null
  castTime: string | null
  resourceCost: string | null
  pointsCost: number | null
  costCustom: string | null
  target: Record<string, unknown> | null
  area: Record<string, unknown> | null
  scaling: Record<string, unknown> | null
  requirement: Record<string, unknown> | null
  effects: unknown[]
}

type SkillView = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  levels: SkillLevelView[]
}

type Props = {
  characterId: string | null
  costsEnabled: boolean
  costResourceName: string
  initialPoints: number
  initialOwnedBySkill: Record<string, number[]>
  skills: SkillView[]
}

function buildLevelKey(skillId: string, level: number) {
  return `${skillId}:${level}`
}

function normalizeOwned(input: Record<string, number[]>) {
  return Object.entries(input).reduce<Record<string, Set<number>>>((acc, [skillId, levels]) => {
    acc[skillId] = new Set(levels)
    return acc
  }, {})
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

function toCategoryLabel(value: string | null) {
  if (!value) return null
  return SKILL_CATEGORY_LABEL[value] ?? value
}

function toTypeLabel(value: string | null) {
  if (!value) return null
  return SKILL_TYPE_LABEL[value] ?? value
}

export default function ClassSkillsClient({
  characterId,
  costsEnabled,
  costResourceName,
  initialPoints,
  initialOwnedBySkill,
  skills,
}: Props) {
  const [points, setPoints] = useState(initialPoints)
  const [ownedBySkill, setOwnedBySkill] = useState(() => normalizeOwned(initialOwnedBySkill))
  const [selectedLevelBySkill, setSelectedLevelBySkill] = useState<Record<string, number>>(() =>
    skills.reduce<Record<string, number>>((acc, skill) => {
      const firstLevel = skill.levels[0]
      if (firstLevel) acc[skill.skillId] = firstLevel.levelNumber
      return acc
    }, {}),
  )
  const [openLevelSelectorForSkill, setOpenLevelSelectorForSkill] = useState("")
  const [loadingKey, setLoadingKey] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const disabledReason = useMemo(() => {
    if (!costsEnabled) return "Sistema de custos desativado neste RPG."
    if (!characterId) return "Personagem da sua classe nao encontrado para compra."
    return ""
  }, [characterId, costsEnabled])

  async function handleBuy(skillId: string, level: number) {
    if (!characterId || !costsEnabled) return

    const key = buildLevelKey(skillId, level)
    if (loadingKey) return
    setLoadingKey(key)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/characters/${characterId}/buy-skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, level }),
      })
      const payload = (await response.json()) as {
        message?: string
        success?: boolean
        remainingPoints?: number
      }

      if (!response.ok || !payload.success) {
        setError(payload.message ?? "Nao foi possivel comprar habilidade.")
        return
      }

      setPoints(typeof payload.remainingPoints === "number" ? payload.remainingPoints : points)
      setOwnedBySkill((prev) => {
        const next = { ...prev }
        const existing = next[skillId] ?? new Set<number>()
        existing.add(level)
        next[skillId] = existing
        return next
      })
      setSuccess("Habilidade comprada com sucesso.")
    } catch {
      setError("Erro de conexao ao comprar habilidade.")
    } finally {
      setLoadingKey("")
    }
  }

  return (
    <>
      <section className={styles.pointsCard}>
        <strong>{costResourceName}</strong>
        <span>{points}</span>
      </section>

      {disabledReason ? <p className={styles.abilityDescription}>{disabledReason}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {success ? <p className={styles.successText}>{success}</p> : null}

      <div className={styles.abilityGrid}>
        {skills.map((skill) => {
          const selectedLevelNumber = selectedLevelBySkill[skill.skillId] ?? skill.levels[0]?.levelNumber
          const selectedLevel =
            skill.levels.find((level) => level.levelNumber === selectedLevelNumber) ?? skill.levels[0]

          if (!selectedLevel) return null

          const owned = ownedBySkill[skill.skillId]?.has(selectedLevel.levelNumber) ?? false
          const key = buildLevelKey(skill.skillId, selectedLevel.levelNumber)
          const loading = loadingKey === key
          const cantAfford =
            typeof selectedLevel.pointsCost === "number" ? points < selectedLevel.pointsCost : true
          const buyDisabled =
            Boolean(disabledReason) ||
            owned ||
            loading ||
            cantAfford ||
            selectedLevel.pointsCost === null
          const levelDescription = hasText(selectedLevel.levelDescription)
            ? selectedLevel.levelDescription
            : hasText(selectedLevel.summary)
            ? selectedLevel.summary
            : hasText(selectedLevel.description)
              ? selectedLevel.description
              : null
          const levelDisplayName = hasText(selectedLevel.levelName)
            ? selectedLevel.levelName
            : skill.skillName
          const baseDescription = normalizeText(skill.skillDescription)
          const levelDescriptionNormalized = normalizeText(levelDescription)
          const showLevelDescription =
            levelDescriptionNormalized.length > 0 && levelDescriptionNormalized !== baseDescription
          const selectorOpen = openLevelSelectorForSkill === skill.skillId

          return (
            <div key={skill.skillId} className={styles.abilityCard}>
              <div className={styles.abilityHeader}>
                <h3 className={styles.abilityName}>{levelDisplayName}</h3>
                <div className={styles.levelSelector}>
                  <button
                    type="button"
                    className={styles.levelToggleButton}
                    onClick={() =>
                      setOpenLevelSelectorForSkill((prev) => (prev === skill.skillId ? "" : skill.skillId))
                    }
                  >
                    Level {selectedLevel.levelNumber}
                  </button>
                  {selectorOpen ? (
                    <div className={styles.levelMenu}>
                      {skill.levels.map((levelOption) => (
                        <button
                          key={buildLevelKey(skill.skillId, levelOption.levelNumber)}
                          type="button"
                          className={
                            levelOption.levelNumber === selectedLevel.levelNumber
                              ? `${styles.levelMenuItem} ${styles.levelMenuItemActive}`
                              : styles.levelMenuItem
                          }
                          onClick={() => {
                            setSelectedLevelBySkill((prev) => ({
                              ...prev,
                              [skill.skillId]: levelOption.levelNumber,
                            }))
                            setOpenLevelSelectorForSkill("")
                          }}
                        >
                          Level {levelOption.levelNumber}
                          {hasText(levelOption.levelName) ? ` - ${levelOption.levelName}` : ""}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              {hasText(skill.skillDescription) ? (
                <p className={styles.abilityDescription}>{skill.skillDescription}</p>
              ) : null}

              <div className={styles.levelRow}>
                <div className={styles.levelInfo}>
                  {showLevelDescription ? (
                    <p className={styles.abilityDescription}>{levelDescription}</p>
                  ) : null}
                  <div className={styles.abilityStats}>
                    {hasText(skill.skillCategory) ? (
                      <div className={styles.statItem}>
                        <strong>Categoria</strong>
                        {toCategoryLabel(skill.skillCategory)}
                      </div>
                    ) : null}
                    {hasText(skill.skillType) ? (
                      <div className={styles.statItem}>
                        <strong>Tipo</strong>
                        {toTypeLabel(skill.skillType)}
                      </div>
                    ) : null}
                    {hasText(selectedLevel.damage) ? (
                      <div className={styles.statItem}>
                        <strong>Dano</strong>
                        {selectedLevel.damage}
                      </div>
                    ) : null}
                    {hasText(selectedLevel.range) ? (
                      <div className={styles.statItem}>
                        <strong>Alcance</strong>
                        {selectedLevel.range}
                      </div>
                    ) : null}
                    {hasText(selectedLevel.cooldown) ? (
                      <div className={styles.statItem}>
                        <strong>Recarga</strong>
                        {selectedLevel.cooldown}
                      </div>
                    ) : null}
                    {hasText(selectedLevel.duration) ? (
                      <div className={styles.statItem}>
                        <strong>Duracao</strong>
                        {selectedLevel.duration}
                      </div>
                    ) : null}
                    {hasText(selectedLevel.castTime) ? (
                      <div className={styles.statItem}>
                        <strong>Conjuracao</strong>
                        {selectedLevel.castTime}
                      </div>
                    ) : null}
                    {hasText(selectedLevel.resourceCost) ? (
                      <div className={styles.statItem}>
                        <strong>Custo de recurso</strong>
                        {selectedLevel.resourceCost}
                      </div>
                    ) : null}
                    {selectedLevel.notesList.length > 0 ? (
                      <div className={`${styles.statItem} ${styles.statItemFull}`}>
                        <strong>Obs</strong>
                        {selectedLevel.notesList.join(" | ")}
                      </div>
                    ) : null}
                    <div className={styles.statItem}>
                      <strong>Requisito</strong>
                      Level {selectedLevel.levelRequired}
                    </div>
                    {hasText(selectedLevel.costCustom) ? (
                      <div className={styles.statItem}>
                        <strong>Custo custom</strong>
                        {selectedLevel.costCustom}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={styles.buyAction}>
                  {typeof selectedLevel.pointsCost === "number" ? (
                    <span className={styles.buyPrice}>
                      Preco: {selectedLevel.pointsCost}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={styles.buyButton}
                    disabled={buyDisabled}
                    onClick={() => void handleBuy(skill.skillId, selectedLevel.levelNumber)}
                  >
                    {owned ? "Comprado" : loading ? "Comprando..." : "Comprar"}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

