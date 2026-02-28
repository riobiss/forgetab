"use client"

import { useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { Filter } from "lucide-react"
import styles from "./page.module.css"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"

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
  skillTags: string[]
  summary: string | null
  damage: string | null
  range: string | null
  cooldown: string | null
  duration: string | null
  castTime: string | null
  resourceCost: string | null
  prerequisite: string | null
  allowedClasses: string[]
  allowedRaces: string[]
  levelRequired: number
  pointsCost: number | null
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
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false)

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

  const tagOptions = useMemo(
    () =>
      Array.from(
        new Set(
          abilities
            .flatMap((item) => item.skillTags)
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        ),
      ),
    [abilities],
  )

  const activeExtraFilters = (selectedCategory ? 1 : 0) + selectedTags.length

  const baseFiltered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return abilities.filter((ability) => {
      if (selectedCategory && ability.skillCategory !== selectedCategory) return false
      if (selectedTags.length > 0 && !selectedTags.some((tag) => ability.skillTags.includes(tag))) return false

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
        ability.prerequisite,
        ability.costCustom,
        ability.allowedClasses.join(" "),
        ability.allowedRaces.join(" "),
        ability.notesList.join(" "),
      ]
        .filter((item): item is string => hasText(item))
        .join(" ")
        .toLowerCase()

      return target.includes(query)
    })
  }, [abilities, search, selectedCategory, selectedTags])

  const typeOptions = useMemo(() => {
    const catalogTypes = Object.keys(SKILL_TYPE_LABEL)
    const customTypes = Array.from(
      new Set(
        abilities
          .map((item) => item.skillType?.trim())
          .filter((item): item is string => typeof item === "string" && item.length > 0)
          .filter((item) => !catalogTypes.includes(item)),
      ),
    )
    return [...catalogTypes, ...customTypes]
  }, [abilities])

  const filtered = useMemo(
    () => (selectedType ? baseFiltered.filter((ability) => ability.skillType === selectedType) : baseFiltered),
    [baseFiltered, selectedType],
  )

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))
  }

  function clearExtraFilters() {
    setSelectedCategory("")
    setSelectedTags([])
  }

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.filtersTopRow}>
          <label className={`${styles.filterField} ${styles.filterFieldSearch}`}>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar..."
            />
          </label>
          <button
            type="button"
            className={styles.filtersIconButton}
            onClick={() => setIsFiltersDrawerOpen(true)}
            aria-label="Abrir filtros"
            aria-haspopup="dialog"
            aria-expanded={isFiltersDrawerOpen}
            aria-controls="abilities-filters-drawer"
            title="Filtros"
          >
            <Filter size={18} aria-hidden="true" />
            {activeExtraFilters > 0 ? <span className={styles.filtersCount}>{activeExtraFilters}</span> : null}
          </button>
        </div>
        <div className={styles.typesRow}>
          <div className={`${styles.typeChips} ${styles.typeChipsScrollable}`}>
            <button
              type="button"
              className={selectedType === null ? `${styles.typeChip} ${styles.typeChipActive}` : styles.typeChip}
              onClick={() => setSelectedType(null)}
            >
              Todos
            </button>
            {typeOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={selectedType === item ? `${styles.typeChip} ${styles.typeChipActive}` : styles.typeChip}
                onClick={() => setSelectedType(item)}
              >
                {toTypeLabel(item)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isFiltersDrawerOpen ? (
        <>
          <button
            type="button"
            className={styles.drawerBackdrop}
            aria-label="Fechar filtros"
            onClick={() => setIsFiltersDrawerOpen(false)}
          />
          <aside id="abilities-filters-drawer" className={styles.drawer} role="dialog" aria-modal="true">
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Filtros</h3>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setIsFiltersDrawerOpen(false)}
                aria-label="Fechar"
              >
                Fechar
              </button>
            </div>

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

            <div className={styles.drawerTagsSection}>
              <span className={styles.typesLabel}>Tags</span>
              <div className={styles.typeChips}>
                {tagOptions.length === 0 ? (
                  <p className={styles.drawerEmptyText}>Nenhuma tag disponivel.</p>
                ) : (
                  tagOptions.map((tag) => {
                    const meta = getSkillTagMeta(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={
                          selectedTags.includes(tag)
                            ? `${styles.typeChip} ${styles.typeChipActive}`
                            : styles.typeChip
                        }
                        onClick={() => toggleTag(tag)}
                      >
                        {meta?.label ?? tag}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button type="button" className={styles.drawerClear} onClick={clearExtraFilters}>
                Limpar filtros
              </button>
            </div>
          </aside>
        </>
      ) : null}

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>Nenhuma habilidade encontrada com os filtros atuais.</p>
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map((ability) => (
            <article
              key={`${ability.skillId}:${ability.levelNumber}`}
              className={
                ability.skillTags[0] && getSkillTagMeta(ability.skillTags[0])
                  ? `${styles.card} ${styles.cardTagged}`
                  : styles.card
              }
              style={
                (() => {
                  const meta = ability.skillTags[0] ? getSkillTagMeta(ability.skillTags[0]) : null
                  if (!meta) return undefined

                  return {
                    "--tag-card-c1": meta.cardC1,
                    "--tag-card-c2": meta.cardC2,
                    "--tag-card-c3": meta.cardC3,
                    "--tag-card-border": meta.cardBorder,
                    "--tag-card-glow": meta.cardGlow,
                  } as CSSProperties
                })()
              }
            >
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
                <div className={styles.detailItem}>
                  <span className={styles.detailLabelOrange}>ID</span>
                  <span className={styles.detailValue}>{ability.skillId}</span>
                </div>
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
                    <span className={styles.detailLabelOrange}>TIPO DA ACAO</span>
                    <span className={styles.detailValue}>
                      {toActionTypeLabel(ability.skillActionType)}
                    </span>
                  </div>
                ) : null}
                {ability.skillTags.length > 0 ? (
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>TAGS</span>
                    <span className={styles.detailValue}>
                      {ability.skillTags
                        .map((tag) => getSkillTagMeta(tag)?.label)
                        .filter((label): label is string => Boolean(label))
                        .join(" | ")}
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
                <div className={styles.detailItem}>
                  <span className={styles.detailLabelOrange}>LEVEL REQ.</span>
                  <span className={styles.detailValue}>{ability.levelRequired}</span>
                </div>
                {ability.pointsCost !== null ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>PRECO</span>
                    <span className={styles.detailValue}>{ability.pointsCost}</span>
                  </div>
                ) : null}
                {hasText(ability.costCustom) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CUSTO</span>
                    <span className={styles.detailValue}>{ability.costCustom}</span>
                  </div>
                ) : null}
                {hasText(ability.prerequisite) ? (
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>PRE-REQUISITO</span>
                    <span className={styles.detailValue}>{ability.prerequisite}</span>
                  </div>
                ) : null}
                {ability.allowedClasses.length > 0 ? (
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>CLASSES PERMITIDAS</span>
                    <span className={styles.detailValue}>{ability.allowedClasses.join(" | ")}</span>
                  </div>
                ) : null}
                {ability.allowedRaces.length > 0 ? (
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>RACAS PERMITIDAS</span>
                    <span className={styles.detailValue}>{ability.allowedRaces.join(" | ")}</span>
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
