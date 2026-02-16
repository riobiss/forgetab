"use client"

import { useMemo, useState } from "react"
import styles from "./page.module.css"

type SkillLevelView = {
  levelNumber: number
  levelRequired: number
  summary: string
  damage: string | null
  range: string | null
  cooldown: string | null
  pointsCost: number | null
}

type SkillView = {
  skillId: string
  skillName: string
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
        {skills.map((skill) => (
          <div key={skill.skillId} className={styles.abilityCard}>
            <div className={styles.abilityHeader}>
              <h3 className={styles.abilityName}>{skill.skillName}</h3>
            </div>

            <div className={styles.levelList}>
              {skill.levels.map((level) => {
                const owned = ownedBySkill[skill.skillId]?.has(level.levelNumber) ?? false
                const key = buildLevelKey(skill.skillId, level.levelNumber)
                const loading = loadingKey === key
                const cantAfford =
                  typeof level.pointsCost === "number" ? points < level.pointsCost : true
                const buyDisabled =
                  Boolean(disabledReason) ||
                  owned ||
                  loading ||
                  cantAfford ||
                  level.pointsCost === null

                return (
                  <div key={key} className={styles.levelRow}>
                    <div className={styles.levelInfo}>
                      <span className={styles.abilityLevel}>Nivel {level.levelNumber}</span>
                      <p className={styles.abilityDescription}>{level.summary}</p>
                      <div className={styles.abilityStats}>
                        <div className={styles.statItem}>
                          <strong>Tipo</strong>
                          {skill.skillType ?? "-"}
                        </div>
                        <div className={styles.statItem}>
                          <strong>Dano</strong>
                          {level.damage ?? "-"}
                        </div>
                        <div className={styles.statItem}>
                          <strong>Alcance</strong>
                          {level.range ?? "-"}
                        </div>
                        <div className={styles.statItem}>
                          <strong>Recarga</strong>
                          {level.cooldown ?? "-"}
                        </div>
                        <div className={styles.statItem}>
                          <strong>Requisito</strong>
                          Nivel {level.levelRequired}
                        </div>
                        <div className={styles.statItem}>
                          <strong>Custo</strong>
                          {level.pointsCost === null ? "Nao configurado" : `${level.pointsCost} ${costResourceName}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.buyButton}
                      disabled={buyDisabled}
                      onClick={() => void handleBuy(skill.skillId, level.levelNumber)}
                    >
                      {owned ? "Comprado" : loading ? "Comprando..." : "Comprar"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
