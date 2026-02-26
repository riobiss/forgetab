"use client"

import { useMemo, useState } from "react"
import styles from "./page.module.css"
import { NativeSelectField } from "@/components/select/NativeSelectField"

type PurchasedAbilityView = {
  skillId: string
  levelNumber: number
  skillName: string
  levelName: string | null
  skillDescription: string | null
  levelDescription: string | null
  notesList: string[]
  skillCategory: string | null
  skillType: string | null
  skillActionType: string | null
  summary: string | null
  damage: string | null
  range: string | null
  cooldown: string | null
  duration: string | null
  castTime: string | null
  resourceCost: string | null
  costCustom: string | null
}

const SKILL_CATEGORY_LABEL: Record<string, string> = {
  tecnicas: "Técnicas",
  arcana: "Arcana",
  espiritual: "Espiritual",
  mental: "Mental",
  natural: "Natural",
  tecnologica: "Tecnológica",
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

export default function AbilitiesFiltersClient({ abilities }: { abilities: PurchasedAbilityView[] }) {
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedRange, setSelectedRange] = useState("")

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          abilities
            .map((item) => item.skillType?.trim())
            .filter((item): item is string => Boolean(item)),
        ),
      ),
    [abilities],
  )

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          abilities
            .map((item) => item.skillCategory?.trim())
            .filter((item): item is string => Boolean(item)),
        ),
      ),
    [abilities],
  )

  const rangeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          abilities
            .map((item) => item.range?.trim())
            .filter((item): item is string => Boolean(item)),
        ),
      ),
    [abilities],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return abilities.filter((ability) => {
      if (selectedType && ability.skillType !== selectedType) return false
      if (selectedCategory && ability.skillCategory !== selectedCategory) return false
      if (selectedRange && ability.range !== selectedRange) return false

      if (!query) return true

      const target = [
        ability.levelName ?? ability.skillName,
        ability.skillDescription,
        ability.levelDescription,
        ability.summary,
        ability.damage,
        ability.range,
        ability.cooldown,
        ability.resourceCost,
        ability.costCustom,
        ability.notesList.join(" "),
      ]
        .filter((item): item is string => hasText(item))
        .join(" ")
        .toLowerCase()

      return target.includes(query)
    })
  }, [abilities, search, selectedType, selectedCategory, selectedRange])

  return (
    <>
      <div className={styles.filters}>
        <label className={`${styles.filterField} ${styles.filterFieldSearch}`}>
          <span>Pesquisar</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, descricao, dano..."
          />
        </label>
        <label className={styles.filterField}>
          <span>Tipo</span>
          <NativeSelectField value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            <option value="">Todos</option>
            {typeOptions.map((item) => (
              <option key={item} value={item}>
                {toTypeLabel(item)}
              </option>
            ))}
          </NativeSelectField>
        </label>
        <label className={styles.filterField}>
          <span>Categoria</span>
          <NativeSelectField value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            <option value="">Todas</option>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {toCategoryLabel(item)}
              </option>
            ))}
          </NativeSelectField>
        </label>
        <label className={styles.filterField}>
          <span>Alcance</span>
          <NativeSelectField value={selectedRange} onChange={(event) => setSelectedRange(event.target.value)}>
            <option value="">Todos</option>
            {rangeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </NativeSelectField>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>Nenhuma habilidade encontrada com os filtros atuais.</p>
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map((ability) => (
            <article key={`${ability.skillId}:${ability.levelNumber}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{ability.levelName ?? ability.skillName}</h3>
                <span className={styles.levelBadge}>Level {ability.levelNumber}</span>
              </div>

              {ability.skillDescription ? (
                <p className={styles.cardBodyItalic}>{ability.skillDescription}</p>
              ) : null}
              {(() => {
                const levelDescription = hasText(ability.levelDescription)
                  ? ability.levelDescription
                  : hasText(ability.summary)
                    ? ability.summary
                    : null
                const baseDescription = normalizeText(ability.skillDescription)
                const levelDescriptionNormalized = normalizeText(levelDescription)
                const showLevelDescription =
                  levelDescriptionNormalized.length > 0 && levelDescriptionNormalized !== baseDescription
                return showLevelDescription ? (
                  <p className={styles.cardBodyItalic}>{levelDescription}</p>
                ) : null
              })()}

              <div className={styles.cardDetailsGrid}>
                {hasText(ability.skillCategory) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CATEGORIA</span>
                    <span className={styles.detailValue}>{toCategoryLabel(ability.skillCategory)}</span>
                  </div>
                ) : null}
                {hasText(ability.skillType) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>TIPO</span>
                    <span className={styles.detailValue}>{toTypeLabel(ability.skillType)}</span>
                  </div>
                ) : null}
                {hasText(ability.skillActionType) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>ACTION TYPE</span>
                    <span className={styles.detailValue}>
                      {toActionTypeLabel(ability.skillActionType)}
                    </span>
                  </div>
                ) : null}
                {hasText(ability.damage) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>DANO</span>
                    <span className={styles.detailValue}>{ability.damage}</span>
                  </div>
                ) : null}
                {hasText(ability.range) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>ALCANCE</span>
                    <span className={styles.detailValue}>{ability.range}</span>
                  </div>
                ) : null}
                {hasText(ability.cooldown) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>RECARGA</span>
                    <span className={styles.detailValue}>{ability.cooldown}</span>
                  </div>
                ) : null}
                {hasText(ability.duration) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>DURACAO</span>
                    <span className={styles.detailValue}>{ability.duration}</span>
                  </div>
                ) : null}
                {hasText(ability.castTime) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CONJURACAO</span>
                    <span className={styles.detailValue}>{ability.castTime}</span>
                  </div>
                ) : null}
                {hasText(ability.resourceCost) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CUSTO RECURSO</span>
                    <span className={styles.detailValue}>{ability.resourceCost}</span>
                  </div>
                ) : null}
                {hasText(ability.costCustom) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CUSTO</span>
                    <span className={styles.detailValue}>{ability.costCustom}</span>
                  </div>
                ) : null}
                {ability.notesList.length > 0 ? (
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>OBS</span>
                    <span className={styles.detailValue}>{ability.notesList.join(" | ")}</span>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

