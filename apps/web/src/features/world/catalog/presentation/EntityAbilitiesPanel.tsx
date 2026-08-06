"use client"

import { useMemo, useState } from "react"
import type {
  EntityCatalogAbilityPurchaseState,
  EntityCatalogAbilityView
} from "@/features/world/catalog/application/types"
import EntityAbilityCard from "@/features/world/catalog/presentation/EntityAbilityCard"
import { useEntityAbilityPurchase } from "@/features/world/catalog/presentation/useEntityAbilityPurchase"
import styles from "./EntityAbilitiesPanel.module.css"

type Props = {
  skills: EntityCatalogAbilityView[]
  purchase?: EntityCatalogAbilityPurchaseState
}

function normalizeOwned(input: Record<string, number[]>) {
  return Object.entries(input).reduce<Record<string, Set<number>>>(
    (result, [skillId, levels]) => {
      result[skillId] = new Set(levels)
      return result
    },
    {}
  )
}

function buildLevelKey(skillId: string, level: number) {
  return `${skillId}:${level}`
}

export default function EntityAbilitiesPanel({ skills, purchase }: Props) {
  const [selectedLevelBySkill, setSelectedLevelBySkill] = useState<
    Record<string, number>
  >(() =>
    skills.reduce<Record<string, number>>((result, skill) => {
      const firstLevel = skill.levels[0]
      if (firstLevel) result[skill.skillId] = firstLevel.levelNumber
      return result
    }, {})
  )
  const [openLevelSelectorForSkill, setOpenLevelSelectorForSkill] = useState("")
  const [ownedBySkill, setOwnedBySkill] = useState(() =>
    normalizeOwned(purchase?.initialOwnedBySkill ?? {})
  )
  const purchaseActions = useEntityAbilityPurchase({ purchase })

  const disabledReason = useMemo(() => {
    if (!purchase) return ""
    if (!purchase.costsEnabled) {
      return "Sistema de custos desativado neste RPG."
    }
    if (!purchase.characterId) {
      return "Nenhum personagem elegivel para comprar esta habilidade."
    }
    return ""
  }, [purchase])

  if (skills.length === 0) return null

  async function handleBuy(skillId: string, level: number) {
    if (!purchase?.characterId || !purchase.costsEnabled) return

    const result = await purchaseActions.buySkill(
      skillId,
      level,
      buildLevelKey(skillId, level)
    )
    if (!result) return

    setOwnedBySkill((current) => ({
      ...current,
      [skillId]: new Set([...(current[skillId] ?? []), level])
    }))
  }

  return (
    <>
      {purchase ? (
        <>
          <section className={styles.pointsCard}>
            <strong>{purchase.costResourceName}</strong>
            <span>{purchaseActions.points}</span>
          </section>
          {disabledReason ? (
            <p className={styles.feedbackText}>{disabledReason}</p>
          ) : null}
        </>
      ) : null}

      <div className={styles.abilityGrid}>
        {skills.map((skill) => (
          <EntityAbilityCard
            key={skill.skillId}
            skill={skill}
            selectedLevelNumber={selectedLevelBySkill[skill.skillId]}
            selectorOpen={openLevelSelectorForSkill === skill.skillId}
            ownedLevels={ownedBySkill[skill.skillId]}
            purchase={purchase}
            points={purchaseActions.points}
            loadingKey={purchaseActions.loadingKey}
            disabledReason={disabledReason}
            onToggleSelector={() =>
              setOpenLevelSelectorForSkill((current) =>
                current === skill.skillId ? "" : skill.skillId
              )
            }
            onSelectLevel={(level) => {
              setSelectedLevelBySkill((current) => ({
                ...current,
                [skill.skillId]: level
              }))
              setOpenLevelSelectorForSkill("")
            }}
            onBuy={(level) => void handleBuy(skill.skillId, level)}
          />
        ))}
      </div>
    </>
  )
}
