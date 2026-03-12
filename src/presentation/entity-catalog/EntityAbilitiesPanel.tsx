"use client"

import { useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import type { EntityCatalogAbilityView } from "@/application/entityCatalog/use-cases/entityCatalogAbilities"
import { useEntityAbilityPurchase } from "@/presentation/entity-catalog/useEntityAbilityPurchase"
import styles from "./EntityAbilitiesPanel.module.css"

const SKILL_CATEGORY_LABEL: Record<string, string> = {
  tecnicas: "Tecnicas",
  arcana: "Arcana",
  espiritual: "Espiritual",
  mental: "Mental",
  natural: "Natural",
  tecnologica: "Tecnologica",
}

const SKILL_TYPE_LABEL: Record<string, string> = {
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

const SKILL_ACTION_TYPE_LABEL: Record<string, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

type Props = {
  skills: EntityCatalogAbilityView[]
  purchase?: {
    characterId: string | null
    costsEnabled: boolean
    costResourceName: string
    initialPoints: number
    initialOwnedBySkill: Record<string, number[]>
  }
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

function toActionTypeLabel(value: string | null) {
  if (!value) return null
  return SKILL_ACTION_TYPE_LABEL[value] ?? value
}

function normalizeOwned(input: Record<string, number[]>) {
  return Object.entries(input).reduce<Record<string, Set<number>>>((acc, [skillId, levels]) => {
    acc[skillId] = new Set(levels)
    return acc
  }, {})
}

function buildLevelKey(skillId: string, level: number) {
  return `${skillId}:${level}`
}

export default function EntityAbilitiesPanel({ skills, purchase }: Props) {
  const [selectedLevelBySkill, setSelectedLevelBySkill] = useState<Record<string, number>>(() =>
    skills.reduce<Record<string, number>>((acc, skill) => {
      const firstLevel = skill.levels[0]
      if (firstLevel) acc[skill.skillId] = firstLevel.levelNumber
      return acc
    }, {}),
  )
  const [openLevelSelectorForSkill, setOpenLevelSelectorForSkill] = useState("")
  const [ownedBySkill, setOwnedBySkill] = useState(() => normalizeOwned(purchase?.initialOwnedBySkill ?? {}))
  const purchaseActions = useEntityAbilityPurchase({ purchase })

  const disabledReason = useMemo(() => {
    if (!purchase) return ""
    if (!purchase.costsEnabled) return "Sistema de custos desativado neste RPG."
    if (!purchase.characterId) return "Personagem compativel nao encontrado para compra."
    return ""
  }, [purchase])

  if (skills.length === 0) {
    return null
  }

  async function handleBuy(skillId: string, level: number) {
    if (!purchase?.characterId || !purchase.costsEnabled) return

    const key = buildLevelKey(skillId, level)
    if (purchaseActions.loadingKey) return

    try {
      const result = await purchaseActions.buySkill(skillId, level, key)
      if (!result) {
        return
      }

      setOwnedBySkill((prev) => {
        const next = { ...prev }
        const existing = next[skillId] ?? new Set<number>()
        existing.add(level)
        next[skillId] = existing
        return next
      })
    } catch {}
  }

  return (
    <>
      {purchase ? (
        <>
          <section className={styles.pointsCard}>
            <strong>{purchase.costResourceName}</strong>
            <span>{purchaseActions.points}</span>
          </section>
          {disabledReason ? <p className={styles.feedbackText}>{disabledReason}</p> : null}
        </>
      ) : null}

      <div className={styles.abilityGrid}>
      {skills.map((skill) => {
        const selectedLevelNumber = selectedLevelBySkill[skill.skillId] ?? skill.levels[0]?.levelNumber
        const selectedLevel =
          skill.levels.find((level) => level.levelNumber === selectedLevelNumber) ?? skill.levels[0]

        if (!selectedLevel) return null

        const levelDescription = hasText(selectedLevel.levelDescription)
          ? selectedLevel.levelDescription
          : hasText(selectedLevel.summary)
            ? selectedLevel.summary
            : hasText(selectedLevel.description)
              ? selectedLevel.description
              : null
        const levelDisplayName = hasText(selectedLevel.levelName) ? selectedLevel.levelName : skill.skillName
        const baseDescription = normalizeText(skill.skillDescription)
        const levelDescriptionNormalized = normalizeText(levelDescription)
        const showLevelDescription =
          levelDescriptionNormalized.length > 0 && levelDescriptionNormalized !== baseDescription
        const selectorOpen = openLevelSelectorForSkill === skill.skillId
        const primaryTag = skill.skillTags[0] ?? null
        const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
        const owned = ownedBySkill[skill.skillId]?.has(selectedLevel.levelNumber) ?? false
        const key = buildLevelKey(skill.skillId, selectedLevel.levelNumber)
        const loading = purchaseActions.loadingKey === key
        const pointsCost = selectedLevel.pointsCost ?? 0
        const cantAfford = purchase ? purchaseActions.points < pointsCost : false
        const buyDisabled = Boolean(disabledReason) || owned || loading || cantAfford

        return (
          <div
            key={skill.skillId}
            className={tagMeta ? `${styles.abilityCard} ${styles.abilityCardTagged}` : styles.abilityCard}
            style={
              tagMeta
                ? ({
                    "--tag-card-c1": tagMeta.cardC1,
                    "--tag-card-c2": tagMeta.cardC2,
                    "--tag-card-c3": tagMeta.cardC3,
                    "--tag-card-border": tagMeta.cardBorder,
                    "--tag-card-glow": tagMeta.cardGlow,
                    "--tag-card-key-text": tagMeta.cardKeyText,
                    "--tag-card-value-text": tagMeta.cardValueText,
                  } as CSSProperties)
                : undefined
            }
          >
            <div className={styles.abilityHeader}>
              <div className={styles.headerMain}>
                <h3 className={styles.abilityName}>{levelDisplayName}</h3>
                {typeof selectedLevel.pointsCost === "number" ? (
                  <span className={styles.pointsBadge}>Custo {selectedLevel.pointsCost}</span>
                ) : null}
              </div>

              {skill.levels.length > 1 ? (
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
              ) : null}
            </div>

            {hasText(skill.skillDescription) ? <p className={styles.abilityDescription}>{skill.skillDescription}</p> : null}
            {showLevelDescription ? <p className={styles.abilityDescription}>{levelDescription}</p> : null}

            <div className={styles.levelRow}>
              <div className={styles.levelInfo}>
                <div className={styles.abilityStats}>
                  <div className={styles.statItem}>
                    <strong>Requisito</strong>
                    Level {selectedLevel.levelRequired}
                  </div>
                  {hasText(selectedLevel.levelCategory ?? skill.skillCategory) ? (
                    <div className={styles.statItem}>
                      <strong>Categoria</strong>
                      {toCategoryLabel(selectedLevel.levelCategory ?? skill.skillCategory)}
                    </div>
                  ) : null}
                  {hasText(selectedLevel.levelType ?? skill.skillType) ? (
                    <div className={styles.statItem}>
                      <strong>Tipo</strong>
                      {toTypeLabel(selectedLevel.levelType ?? skill.skillType)}
                    </div>
                  ) : null}
                  {hasText(selectedLevel.levelActionType ?? skill.skillActionType) ? (
                    <div className={styles.statItem}>
                      <strong>Acao</strong>
                      {toActionTypeLabel(selectedLevel.levelActionType ?? skill.skillActionType)}
                    </div>
                  ) : null}
                  {skill.skillTags.length > 0 ? (
                    <div className={`${styles.statItem} ${styles.statItemFull}`}>
                      <strong>Tags</strong>
                      {skill.skillTags
                        .map((tag) => getSkillTagMeta(tag)?.label)
                        .filter((label): label is string => Boolean(label))
                        .join(" | ")}
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
                  {hasText(selectedLevel.costCustom) ? (
                    <div className={styles.statItem}>
                      <strong>Custo</strong>
                      {selectedLevel.costCustom}
                    </div>
                  ) : null}
                  {selectedLevel.customFields.map((field) => (
                    <div key={field.id} className={styles.statItem}>
                      <strong>{field.name}</strong>
                      {field.value ?? "-"}
                    </div>
                  ))}
                </div>
              </div>

              {purchase ? (
                <div className={styles.buyAction}>
                  <button
                    type="button"
                    className={styles.buyButton}
                    disabled={buyDisabled}
                    onClick={() => void handleBuy(skill.skillId, selectedLevel.levelNumber)}
                  >
                    {owned ? "Comprado" : loading ? "Comprando..." : "Comprar"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
      </div>
    </>
  )
}
