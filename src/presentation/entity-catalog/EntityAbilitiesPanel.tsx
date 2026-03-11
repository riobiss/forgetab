"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import type { EntityCatalogAbilityView } from "@/application/entityCatalog/use-cases/entityCatalogAbilities"
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

function buildLevelKey(skillId: string, level: number) {
  return `${skillId}:${level}`
}

export default function EntityAbilitiesPanel({ skills }: Props) {
  const [selectedLevelBySkill, setSelectedLevelBySkill] = useState<Record<string, number>>(() =>
    skills.reduce<Record<string, number>>((acc, skill) => {
      const firstLevel = skill.levels[0]
      if (firstLevel) acc[skill.skillId] = firstLevel.levelNumber
      return acc
    }, {}),
  )
  const [openLevelSelectorForSkill, setOpenLevelSelectorForSkill] = useState("")

  if (skills.length === 0) {
    return null
  }

  return (
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
        )
      })}
    </div>
  )
}
