"use client"

import { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { Filter } from "lucide-react"
import styles from "./page.module.css"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"

type PurchasedAbilityView = {
  skillId: string
  levelNumber: number
  skillName: string
  levelName: string | null
  skillDescription: string | null
  levelDescription: string | null
  notesList: string[]
  customFields: Array<{ id: string; name: string; value: string | null }>
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

export default function AbilitiesFiltersClient({
  characterId,
  abilities,
}: {
  characterId: string
  abilities: PurchasedAbilityView[]
}) {
  const [abilityItems, setAbilityItems] = useState<PurchasedAbilityView[]>(abilities)
  const [search, setSearch] = useState("")
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([])
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([])
  const [selectedActionTypeFilters, setSelectedActionTypeFilters] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false)
  const [selectedAbilityModal, setSelectedAbilityModal] = useState<PurchasedAbilityView | null>(null)
  const [isRemovingAbility, setIsRemovingAbility] = useState(false)
  const [removeAbilityError, setRemoveAbilityError] = useState("")

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          abilityItems
            .map((item) => item.skillCategory?.trim())
            .filter((item): item is string => Boolean(item)),
        ),
      ),
    [abilityItems],
  )

  const tagOptions = useMemo(
    () =>
      Array.from(
        new Set(
          abilityItems
            .flatMap((item) => item.skillTags)
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        ),
      ),
    [abilityItems],
  )

  const activeExtraFilters =
    selectedCategoryFilters.length +
    selectedTypeFilters.length +
    selectedActionTypeFilters.length +
    selectedTags.length

  const baseFiltered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return abilityItems.filter((ability) => {
      if (
        selectedCategoryFilters.length > 0 &&
        !selectedCategoryFilters.includes(ability.skillCategory ?? "")
      ) {
        return false
      }
      if (selectedTypeFilters.length > 0 && !selectedTypeFilters.includes(ability.skillType ?? "")) {
        return false
      }
      if (
        selectedActionTypeFilters.length > 0 &&
        !selectedActionTypeFilters.includes(ability.skillActionType ?? "")
      ) {
        return false
      }
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
        ability.customFields.map((field) => `${field.name} ${field.value ?? ""}`).join(" "),
      ]
        .filter((item): item is string => hasText(item))
        .join(" ")
        .toLowerCase()

      return target.includes(query)
    })
  }, [
    abilityItems,
    search,
    selectedActionTypeFilters,
    selectedCategoryFilters,
    selectedTags,
    selectedTypeFilters,
  ])

  const typeOptions = useMemo(() => {
    const catalogTypes = Object.keys(SKILL_TYPE_LABEL)
    const customTypes = Array.from(
      new Set(
        abilityItems
          .map((item) => item.skillType?.trim())
          .filter((item): item is string => typeof item === "string" && item.length > 0)
          .filter((item) => !catalogTypes.includes(item)),
      ),
    )
    return [...catalogTypes, ...customTypes]
  }, [abilityItems])
  const actionTypeOptions = useMemo(() => {
    const catalogActionTypes = Object.keys(SKILL_ACTION_TYPE_LABEL)
    const customActionTypes = Array.from(
      new Set(
        abilityItems
          .map((item) => item.skillActionType?.trim())
          .filter((item): item is string => typeof item === "string" && item.length > 0)
          .filter((item) => !catalogActionTypes.includes(item)),
      ),
    )
    return [...catalogActionTypes, ...customActionTypes]
  }, [abilityItems])
  const filtered = baseFiltered

  async function handleRemoveAbility() {
    if (!selectedAbilityModal || isRemovingAbility) return

    setIsRemovingAbility(true)
    setRemoveAbilityError("")

    try {
      const response = await fetch(`/api/characters/${characterId}/buy-skill`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: selectedAbilityModal.skillId,
          level: selectedAbilityModal.levelNumber,
        }),
      })
      const payload = (await response.json()) as { message?: string; success?: boolean }
      if (!response.ok || !payload.success) {
        setRemoveAbilityError(payload.message ?? "Nao foi possivel remover a habilidade.")
        return
      }

      setAbilityItems((current) =>
        current.filter(
          (item) =>
            !(
              item.skillId === selectedAbilityModal.skillId &&
              item.levelNumber === selectedAbilityModal.levelNumber
            ),
        ),
      )
      setSelectedAbilityModal(null)
    } catch {
      setRemoveAbilityError("Erro de conexao ao remover habilidade.")
    } finally {
      setIsRemovingAbility(false)
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))
  }

  function clearExtraFilters() {
    setSelectedCategoryFilters([])
    setSelectedTypeFilters([])
    setSelectedActionTypeFilters([])
    setSelectedTags([])
  }

  useEffect(() => {
    if (!selectedAbilityModal) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedAbilityModal])

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

            <div className={styles.drawerTagsSection}>
              <span className={styles.typesLabel}>Categoria</span>
              <div className={styles.typeChips}>
                {categoryOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      selectedCategoryFilters.includes(item)
                        ? `${styles.typeChip} ${styles.typeChipActive}`
                        : styles.typeChip
                    }
                    onClick={() =>
                      setSelectedCategoryFilters((current) =>
                        current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
                      )
                    }
                  >
                    {toCategoryLabel(item)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.drawerTagsSection}>
              <span className={styles.typesLabel}>Tipo</span>
              <div className={styles.typeChips}>
                {typeOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      selectedTypeFilters.includes(item)
                        ? `${styles.typeChip} ${styles.typeChipActive}`
                        : styles.typeChip
                    }
                    onClick={() =>
                      setSelectedTypeFilters((current) =>
                        current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
                      )
                    }
                  >
                    {toTypeLabel(item)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.drawerTagsSection}>
              <span className={styles.typesLabel}>Tipo da ação</span>
              <div className={styles.typeChips}>
                {actionTypeOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      selectedActionTypeFilters.includes(item)
                        ? `${styles.typeChip} ${styles.typeChipActive}`
                        : styles.typeChip
                    }
                    onClick={() =>
                      setSelectedActionTypeFilters((current) =>
                        current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
                      )
                    }
                  >
                    {toActionTypeLabel(item)}
                  </button>
                ))}
              </div>
            </div>

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
                    "--tag-card-key-text": meta.cardKeyText,
                    "--tag-card-value-text": meta.cardValueText,
                  } as CSSProperties
                })()
              }
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <button
                    type="button"
                    className={styles.skillTitleButton}
                    onClick={() => {
                      setRemoveAbilityError("")
                      setSelectedAbilityModal(ability)
                    }}
                  >
                    {ability.levelName ?? ability.skillName}
                  </button>
                </h3>
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
                {hasText(ability.skillActionType) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>AÇÃO</span>
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
                {ability.customFields.map((field) => (
                  <div key={field.id} className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>{field.name}</span>
                    <span className={styles.detailValue}>{field.value ?? "-"}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedAbilityModal ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Detalhes da habilidade"
          onClick={() => setSelectedAbilityModal(null)}
        >
          <section className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{selectedAbilityModal.levelName ?? selectedAbilityModal.skillName}</h3>
              <button type="button" className={styles.drawerClose} onClick={() => setSelectedAbilityModal(null)}>
                Fechar
              </button>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.detailLabelOrange}>Categoria</span>
              <p className={styles.modalText}>
                {toCategoryLabel(selectedAbilityModal.skillCategory) ?? "Nao informado"}
              </p>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.detailLabelOrange}>Tipos</span>
              <p className={styles.modalText}>
                {toTypeLabel(selectedAbilityModal.skillType) ?? "Nao informado"}
                {" | "}
                {toActionTypeLabel(selectedAbilityModal.skillActionType) ?? "Nao informado"}
              </p>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.detailLabelOrange}>Requirements</span>
              <p className={styles.modalText}>Level requerido: {selectedAbilityModal.levelRequired}</p>
              {hasText(selectedAbilityModal.prerequisite) ? (
                <p className={styles.modalText}>Pre-requisito: {selectedAbilityModal.prerequisite}</p>
              ) : null}
              {selectedAbilityModal.allowedClasses.length > 0 ? (
                <p className={styles.modalText}>
                  Classes permitidas: {selectedAbilityModal.allowedClasses.join(" | ")}
                </p>
              ) : null}
              {selectedAbilityModal.allowedRaces.length > 0 ? (
                <p className={styles.modalText}>
                  Racas permitidas: {selectedAbilityModal.allowedRaces.join(" | ")}
                </p>
              ) : null}
            </div>

            <div className={styles.modalSection}>
              <span className={styles.detailLabelOrange}>Preço</span>
              {selectedAbilityModal.pointsCost !== null ? (
                <p className={styles.modalText}>{selectedAbilityModal.pointsCost}</p>
              ) : (
                <p className={styles.modalText}>Nao informado</p>
              )}
              {hasText(selectedAbilityModal.costCustom) ? (
                <p className={styles.modalText}>Custo extra: {selectedAbilityModal.costCustom}</p>
              ) : null}
            </div>

            <div className={styles.modalSection}>
              <span className={styles.detailLabelOrange}>Tags</span>
              {selectedAbilityModal.skillTags.length > 0 ? (
                <div className={styles.typeChips}>
                  {selectedAbilityModal.skillTags.map((tag) => (
                    <span key={tag} className={styles.typeChip}>
                      {getSkillTagMeta(tag)?.label ?? tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.modalText}>Sem tags</p>
              )}
            </div>
            {selectedAbilityModal.customFields.length > 0 ? (
              <div className={styles.modalSection}>
                <span className={styles.detailLabelOrange}>Campos adicionais</span>
                {selectedAbilityModal.customFields.map((field) => (
                  <p key={field.id} className={styles.modalText}>
                    {field.name}: {field.value ?? "-"}
                  </p>
                ))}
              </div>
            ) : null}
            {removeAbilityError ? <p className={styles.errorText}>{removeAbilityError}</p> : null}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.removeAbilityButton}
                onClick={() => void handleRemoveAbility()}
                disabled={isRemovingAbility}
              >
                {isRemovingAbility ? "Retirando..." : "Retirar habilidade"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
