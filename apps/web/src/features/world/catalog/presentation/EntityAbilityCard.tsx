"use client"

import type { CSSProperties } from "react"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import type {
  EntityCatalogAbilityPurchaseState,
  EntityCatalogAbilityView
} from "@/features/world/catalog/application/types"
import EntityAbilityStats from "@/features/world/catalog/presentation/EntityAbilityStats"
import styles from "./EntityAbilitiesPanel.module.css"

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

function buildLevelKey(skillId: string, level: number) {
  return `${skillId}:${level}`
}

type Props = {
  skill: EntityCatalogAbilityView
  selectedLevelNumber: number | undefined
  selectorOpen: boolean
  ownedLevels: Set<number> | undefined
  purchase?: EntityCatalogAbilityPurchaseState
  points: number
  loadingKey: string
  disabledReason: string
  onToggleSelector(): void
  onSelectLevel(level: number): void
  onBuy(level: number): void
}

export default function EntityAbilityCard({
  skill,
  selectedLevelNumber,
  selectorOpen,
  ownedLevels,
  purchase,
  points,
  loadingKey,
  disabledReason,
  onToggleSelector,
  onSelectLevel,
  onBuy
}: Props) {
  const selectedLevel =
    skill.levels.find((level) => level.levelNumber === selectedLevelNumber) ??
    skill.levels[0]
  if (!selectedLevel) return null

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
  const showLevelDescription =
    normalizeText(levelDescription).length > 0 &&
    normalizeText(levelDescription) !== normalizeText(skill.skillDescription)
  const primaryTag = skill.skillTags[0] ?? null
  const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
  const owned = ownedLevels?.has(selectedLevel.levelNumber) ?? false
  const levelKey = buildLevelKey(skill.skillId, selectedLevel.levelNumber)
  const loading = loadingKey === levelKey
  const cantAfford = purchase ? points < (selectedLevel.pointsCost ?? 0) : false
  const buyDisabled = Boolean(disabledReason) || owned || loading || cantAfford

  return (
    <div
      className={
        tagMeta
          ? `${styles.abilityCard} ${styles.abilityCardTagged}`
          : styles.abilityCard
      }
      style={
        tagMeta
          ? ({
              "--tag-card-c1": tagMeta.cardC1,
              "--tag-card-c2": tagMeta.cardC2,
              "--tag-card-c3": tagMeta.cardC3,
              "--tag-card-border": tagMeta.cardBorder,
              "--tag-card-glow": tagMeta.cardGlow,
              "--tag-card-key-text": tagMeta.cardKeyText,
              "--tag-card-value-text": tagMeta.cardValueText
            } as CSSProperties)
          : undefined
      }
    >
      <div className={styles.abilityHeader}>
        <div className={styles.headerMain}>
          <h3 className={styles.abilityName}>{levelDisplayName}</h3>
          {typeof selectedLevel.pointsCost === "number" ? (
            <span className={styles.pointsBadge}>
              Custo {selectedLevel.pointsCost}
            </span>
          ) : null}
        </div>

        {skill.levels.length > 1 ? (
          <div className={styles.levelSelector}>
            <button
              type="button"
              className={styles.levelToggleButton}
              onClick={onToggleSelector}
              aria-expanded={selectorOpen}
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
                    onClick={() => onSelectLevel(levelOption.levelNumber)}
                  >
                    Level {levelOption.levelNumber}
                    {hasText(levelOption.levelName)
                      ? ` - ${levelOption.levelName}`
                      : ""}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasText(skill.skillDescription) ? (
        <p className={styles.abilityDescription}>{skill.skillDescription}</p>
      ) : null}
      {showLevelDescription ? (
        <p className={styles.abilityDescription}>{levelDescription}</p>
      ) : null}

      <div className={styles.levelRow}>
        <div className={styles.levelInfo}>
          <EntityAbilityStats skill={skill} level={selectedLevel} />
        </div>

        {purchase ? (
          <div className={styles.buyAction}>
            <button
              type="button"
              className={styles.buyButton}
              disabled={buyDisabled}
              onClick={() => onBuy(selectedLevel.levelNumber)}
            >
              {owned ? "Comprado" : loading ? "Comprando..." : "Comprar"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
