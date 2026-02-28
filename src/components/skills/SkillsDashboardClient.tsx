"use client"

import { useEffect, useMemo, useState } from "react"
import { Filter, Plus, Search } from "lucide-react"
import styles from "./page.module.css"
import {
  actionTypeValues,
  skillCategoryValues,
  skillTagValues,
  skillTypeValues,
  type ActionType,
  type SkillCategory,
  type SkillTag,
  type SkillType,
} from "@/types/skillBuilder"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import { ReactSelectField, type ReactSelectOption } from "@/components/select/ReactSelectField"
import {
  abilityCategoryDefinitions,
  abilityCategoryLabelByKey,
  normalizeEnabledAbilityCategories,
} from "@/lib/rpg/abilityCategories"

const actionTypeLabel: Record<ActionType, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

const skillTypeLabel: Record<SkillType, string> = {
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

const skillTagLabel: Record<SkillTag, string> = {
  ice: "Gelo",
  water: "Agua",
  wind: "Vento",
  earth: "Terra",
  light: "Luz",
  dark: "Escuridao",
  shadow: "Sombra",
  infernal: "Infernal",
  holy: "Sagrado",
  poison: "Veneno",
  blood: "Sangue",
  psychic: "Psiquico",
  time: "Tempo",
  sound: "Som",
  arcane: "Arcano",
  void: "Vazio",
  life: "Vida",
  death: "Morte",
  energy: "Energia",
}

type OwnedRpg = { id: string; title: string }
type TemplateOption = { id: string; label: string }
type RpgSettingsPayload = {
  rpg?: {
    abilityCategoriesEnabled?: boolean
    enabledAbilityCategories?: string[]
  }
  message?: string
}

type SkillListItem = {
  id: string
  slug: string
  updatedAt: string
}

type SkillLevel = {
  id: string
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Record<string, unknown> | null
  cost: Record<string, unknown> | null
  requirement: Record<string, unknown> | null
}

type SkillDetail = {
  id: string
  slug: string
  tags: SkillTag[]
  classIds: string[]
  raceIds: string[]
  levels: SkillLevel[]
}

type MetaForm = {
  name: string
  category: SkillCategory | ""
  type: SkillType | ""
  actionType: ActionType | ""
  tags: SkillTag[]
  description: string
  classIds: string[]
  raceIds: string[]
}

type LevelForm = {
  levelName: string
  levelDescription: string
  notesList: string[]
  levelRequired: string
  summary: string
  damage: string
  cooldown: string
  range: string
  duration: string
  castTime: string
  resourceCost: string
  costPoints: string
  costCustom: string
  prerequisite: string
  levelCategory: SkillCategory | ""
  levelType: SkillType | ""
  levelActionType: ActionType | ""
  customFields: { id: string; name: string; value: string }[]
}

type Props = {
  ownedRpgs: OwnedRpg[]
  initialRpgId?: string
  hideRpgSelector?: boolean
  title?: string
}

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeObsList(values: string[]) {
  return values.map((item) => item.trim()).filter((item) => item.length > 0)
}

function mapSkillToMetaForm(skill: SkillDetail): MetaForm {
  const normalizedTags = Array.isArray(skill.tags)
    ? skill.tags.filter((item): item is SkillTag => skillTagValues.includes(item as SkillTag))
    : []

  return {
    name: "",
    category: "",
    type: "",
    actionType: "",
    tags: Array.from(new Set(normalizedTags)),
    description: "",
    classIds: skill.classIds,
    raceIds: skill.raceIds,
  }
}

function mapLevelToForm(level: SkillLevel): LevelForm {
  const stats = level.stats ?? {}
  const cost = level.cost ?? {}
  const requirement = level.requirement ?? {}
  const statsNotesListRaw = Array.isArray(stats.notesList) ? stats.notesList : []
  const statsNotesList = statsNotesListRaw
    .map((item) => (typeof item === "string" ? item : ""))
    .filter((item) => item.trim().length > 0)
  const fallbackNote = typeof stats.notes === "string" ? stats.notes : ""
  const customFieldsRaw = Array.isArray(stats.customFields) ? stats.customFields : []
  const customFields = customFieldsRaw
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const name = typeof record.name === "string" ? record.name.trim() : ""
      if (!name) return null
      const value = typeof record.value === "string" ? record.value : ""
      const id = typeof record.id === "string" && record.id.trim() ? record.id : `custom-${index}`
      return { id, name, value }
    })
    .filter((item): item is { id: string; name: string; value: string } => Boolean(item))

  return {
    levelName: typeof stats.name === "string" ? stats.name : "",
    levelDescription: typeof stats.description === "string" ? stats.description : "",
    notesList: statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : [""],
    levelRequired: String(level.levelRequired),
    summary: level.summary ?? "",
    damage: typeof stats.damage === "string" ? stats.damage : "",
    cooldown: typeof stats.cooldown === "string" ? stats.cooldown : "",
    range: typeof stats.range === "string" ? stats.range : "",
    duration: typeof stats.duration === "string" ? stats.duration : "",
    castTime: typeof stats.castTime === "string" ? stats.castTime : "",
    resourceCost: typeof stats.resourceCost === "string" ? stats.resourceCost : "",
    costPoints: typeof cost.points === "number" ? String(cost.points) : "",
    costCustom: typeof cost.custom === "string" ? cost.custom : "",
    prerequisite: typeof requirement.notes === "string" ? requirement.notes : "",
    levelCategory: skillCategoryValues.includes(stats.category as SkillCategory)
      ? (stats.category as SkillCategory)
      : "",
    levelType: skillTypeValues.includes(stats.type as SkillType) ? (stats.type as SkillType) : "",
    levelActionType: actionTypeValues.includes(stats.actionType as ActionType)
      ? (stats.actionType as ActionType)
      : "",
    customFields,
  }
}

function getLevelCostPoints(level: SkillLevel) {
  if (!level.cost || typeof level.cost !== "object" || Array.isArray(level.cost)) {
    return null
  }

  const value = (level.cost as Record<string, unknown>).points
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null
  }

  return Math.floor(value)
}

function createInitialMeta(): MetaForm {
  return {
    name: "",
    category: "",
    type: "",
    actionType: "",
    tags: [],
    description: "",
    classIds: [],
    raceIds: [],
  }
}

function createInitialLevel(): LevelForm {
  return {
    levelName: "",
    levelDescription: "",
    notesList: [""],
    levelRequired: "1",
    summary: "",
    damage: "",
    cooldown: "",
    range: "",
    duration: "",
    castTime: "",
    resourceCost: "",
    costPoints: "",
    costCustom: "",
    prerequisite: "",
    levelCategory: "",
    levelType: "",
    levelActionType: "",
    customFields: [],
  }
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

function resolveCategoryLabel(value: string) {
  return abilityCategoryLabelByKey[value as SkillCategory] ?? value
}

export default function SkillsDashboardClient({
  ownedRpgs,
  initialRpgId,
  hideRpgSelector = false,
  title = "Construtor de Habilidades",
}: Props) {
  void hideRpgSelector
  void title
  const initialSelection =
    initialRpgId && ownedRpgs.some((item) => item.id === initialRpgId)
      ? initialRpgId
      : (ownedRpgs[0]?.id ?? "")
  const [selectedRpgId, setSelectedRpgId] = useState(initialSelection)
  const [classes, setClasses] = useState<TemplateOption[]>([])
  const [races, setRaces] = useState<TemplateOption[]>([])
  const [skills, setSkills] = useState<SkillListItem[]>([])
  const [skillSearchOpen, setSkillSearchOpen] = useState(false)
  const [skillSearch, setSkillSearch] = useState("")
  const [skillSearchIndex, setSkillSearchIndex] = useState<Record<string, string>>({})
  const [skillDisplayNameById, setSkillDisplayNameById] = useState<Record<string, string>>({})
  const [skillFilterMetaById, setSkillFilterMetaById] = useState<
    Record<string, { categories: string[]; types: string[]; actionTypes: string[]; tags: string[] }>
  >({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([])
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([])
  const [selectedActionTypeFilters, setSelectedActionTypeFilters] = useState<string[]>([])
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [activeSkill, setActiveSkill] = useState<SkillDetail | null>(null)
  const [selectedLevelId, setSelectedLevelId] = useState("")
  const [metaForm, setMetaForm] = useState<MetaForm>(createInitialMeta())
  const [levelForm, setLevelForm] = useState<LevelForm>(createInitialLevel())
  const [abilityCategoriesEnabled, setAbilityCategoriesEnabled] = useState(false)
  const [enabledAbilityCategories, setEnabledAbilityCategories] = useState<SkillCategory[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false)
  const [newCustomFieldName, setNewCustomFieldName] = useState("")
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [editStep, setEditStep] = useState(1)
  const [editReloadKey, setEditReloadKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedLevel = useMemo(
    () => activeSkill?.levels.find((level) => level.id === selectedLevelId) ?? null,
    [activeSkill, selectedLevelId],
  )
  const createCategoryOptions = useMemo(
    () =>
      abilityCategoryDefinitions.filter(
        (option) =>
          !abilityCategoriesEnabled ||
          enabledAbilityCategories.includes(option.key as SkillCategory),
      ),
    [abilityCategoriesEnabled, enabledAbilityCategories],
  )
  const editCategoryOptions = useMemo(() => {
    if (!metaForm.category) return createCategoryOptions
    if (createCategoryOptions.some((option) => option.key === metaForm.category)) {
      return createCategoryOptions
    }

    return [
      ...createCategoryOptions,
      {
        key: metaForm.category,
        label: `${resolveCategoryLabel(metaForm.category)} (indisponivel)`,
        description: "",
      },
    ]
  }, [createCategoryOptions, metaForm.category])
  const tagOptions = useMemo<ReactSelectOption[]>(
    () =>
      skillTagValues.map((tag) => ({
        value: tag,
        label: skillTagLabel[tag],
      })),
    [],
  )
  const selectedRpgTitle = useMemo(
    () => ownedRpgs.find((item) => item.id === selectedRpgId)?.title ?? "Habilidades",
    [ownedRpgs, selectedRpgId],
  )
  const categoryFilterOptions = useMemo(() => [...skillCategoryValues], [])
  const typeFilterOptions = useMemo(() => [...skillTypeValues], [])
  const actionTypeFilterOptions = useMemo(() => [...actionTypeValues], [])
  const tagFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(Object.values(skillFilterMetaById).flatMap((item) => item.tags).filter((item) => item.length > 0)),
      ),
    [skillFilterMetaById],
  )
  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase()

    return skills.filter((skill) => {
      const meta = skillFilterMetaById[skill.id] ?? {
        categories: [],
        types: [],
        actionTypes: [],
        tags: [],
      }
      if (
        selectedCategoryFilters.length > 0 &&
        !selectedCategoryFilters.some((item) => meta.categories.includes(item))
      ) {
        return false
      }
      if (selectedTypeFilters.length > 0 && !selectedTypeFilters.some((item) => meta.types.includes(item))) {
        return false
      }
      if (
        selectedActionTypeFilters.length > 0 &&
        !selectedActionTypeFilters.some((item) => meta.actionTypes.includes(item))
      ) {
        return false
      }
      if (selectedTagFilters.length > 0 && !selectedTagFilters.some((tag) => meta.tags.includes(tag))) return false
      if (!query) return true
      const searchBlob = skillSearchIndex[skill.id] ?? ""
      return searchBlob.includes(query)
    })
  }, [
    selectedActionTypeFilters,
    selectedCategoryFilters,
    selectedTagFilters,
    selectedTypeFilters,
    skillSearch,
    skillSearchIndex,
    skills,
    skillFilterMetaById,
  ])

  useEffect(() => {
    if (!selectedRpgId) return

    async function loadData() {
      setLoading(true)
      setError("")
      try {
        const [classRes, raceRes, skillRes, rpgRes] = await Promise.all([
          fetch(`/api/rpg/${selectedRpgId}/classes`),
          fetch(`/api/rpg/${selectedRpgId}/races`),
          fetch(`/api/skills?rpgId=${selectedRpgId}`),
          fetch(`/api/rpg/${selectedRpgId}`),
        ])

        const classPayload = (await classRes.json()) as { classes?: TemplateOption[]; message?: string }
        const racePayload = (await raceRes.json()) as { races?: TemplateOption[]; message?: string }
        const skillPayload = (await skillRes.json()) as { skills?: SkillListItem[]; message?: string }
        const rpgPayload = (await rpgRes.json()) as RpgSettingsPayload

        if (!classRes.ok) throw new Error(classPayload.message ?? "Erro ao buscar classes.")
        if (!raceRes.ok) throw new Error(racePayload.message ?? "Erro ao buscar racas.")
        if (!skillRes.ok) throw new Error(skillPayload.message ?? "Erro ao buscar skills.")
        if (!rpgRes.ok) throw new Error(rpgPayload.message ?? "Erro ao buscar configuracoes do RPG.")

        setClasses(classPayload.classes ?? [])
        setRaces(racePayload.races ?? [])
        setSkills(skillPayload.skills ?? [])
        setAbilityCategoriesEnabled(Boolean(rpgPayload.rpg?.abilityCategoriesEnabled ?? false))
        setEnabledAbilityCategories(
          normalizeEnabledAbilityCategories(rpgPayload.rpg?.enabledAbilityCategories),
        )
        setSelectedSkillId(skillPayload.skills?.[0]?.id ?? "")
        setEditOpen(false)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro ao carregar dashboard.")
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [selectedRpgId])

  useEffect(() => {
    if (skills.length === 0) {
      setSkillSearchIndex({})
      setSkillDisplayNameById({})
      setSkillFilterMetaById({})
      return
    }

    let cancelled = false

    async function buildSearchIndex() {
      try {
        const entries = await Promise.all(
          skills.map(async (skill) => {
            const response = await fetch(`/api/skills/${skill.id}`)
            const payload = (await response.json()) as { skill?: SkillDetail }
            const detail = payload.skill
            if (!response.ok || !detail) {
              return {
                id: skill.id,
                searchBlob: skill.slug.toLowerCase(),
                displayName: skill.slug,
                filters: {
                  categories: [],
                  types: [],
                  actionTypes: [],
                  tags: [],
                },
              } as const
            }

            const displayName = detail.levels
              .map((level) => {
                const stats = (level.stats ?? {}) as Record<string, unknown>
                return typeof stats.name === "string" ? stats.name.trim() : ""
              })
              .find((name) => name.length > 0) ?? skill.slug

            const merged = detail.levels
              .map((level) => {
                const stats = (level.stats ?? {}) as Record<string, unknown>
                const name = typeof stats.name === "string" ? stats.name : ""
                const description = typeof stats.description === "string" ? stats.description : ""
                return `${name} ${description}`
              })
              .join(" ")
              .toLowerCase()
            const categories = Array.from(
              new Set(
                detail.levels
                  .map((level) => {
                    const stats = (level.stats ?? {}) as Record<string, unknown>
                    return typeof stats.category === "string" ? stats.category.trim() : ""
                  })
                  .filter((item) => item.length > 0),
              ),
            )
            const types = Array.from(
              new Set(
                detail.levels
                  .map((level) => {
                    const stats = (level.stats ?? {}) as Record<string, unknown>
                    return typeof stats.type === "string" ? stats.type.trim() : ""
                  })
                  .filter((item) => item.length > 0),
              ),
            )
            const actionTypes = Array.from(
              new Set(
                detail.levels
                  .map((level) => {
                    const stats = (level.stats ?? {}) as Record<string, unknown>
                    return typeof stats.actionType === "string" ? stats.actionType.trim() : ""
                  })
                  .filter((item) => item.length > 0),
              ),
            )
            const tags = Array.isArray(detail.tags)
              ? Array.from(new Set(detail.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)))
              : []

            return {
              id: skill.id,
              searchBlob: `${skill.slug} ${merged}`.trim(),
              displayName,
              filters: {
                categories,
                types,
                actionTypes,
                tags,
              },
            } as const
          }),
        )

        if (cancelled) return
        setSkillSearchIndex(Object.fromEntries(entries.map((item) => [item.id, item.searchBlob])))
        setSkillDisplayNameById(Object.fromEntries(entries.map((item) => [item.id, item.displayName])))
        setSkillFilterMetaById(Object.fromEntries(entries.map((item) => [item.id, item.filters])))
      } catch {
        if (cancelled) return
        setSkillSearchIndex(
          Object.fromEntries(skills.map((skill) => [skill.id, skill.slug.toLowerCase()] as const)),
        )
        setSkillDisplayNameById(
          Object.fromEntries(skills.map((skill) => [skill.id, skill.slug] as const)),
        )
        setSkillFilterMetaById(
          Object.fromEntries(
            skills.map((skill) => [
              skill.id,
              { categories: [], types: [], actionTypes: [], tags: [] },
            ] as const),
          ),
        )
      }
    }

    void buildSearchIndex()
    return () => {
      cancelled = true
    }
  }, [skills])

  useEffect(() => {
    if (createOpen) return

    if (!selectedSkillId) {
      setActiveSkill(null)
      setSelectedLevelId("")
      setMetaForm(createInitialMeta())
      setLevelForm(createInitialLevel())
      return
    }

    let cancelled = false

    async function loadSkill() {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/skills/${selectedSkillId}`)
        const payload = (await response.json()) as { skill?: SkillDetail; message?: string }
        if (!response.ok || !payload.skill) {
          throw new Error(payload.message ?? "Erro ao carregar skill.")
        }

        if (cancelled) return
        setActiveSkill(payload.skill)
        setMetaForm(mapSkillToMetaForm(payload.skill))
        const firstLevel = payload.skill.levels[0]
        setSelectedLevelId(firstLevel?.id ?? "")
        setLevelForm(firstLevel ? mapLevelToForm(firstLevel) : createInitialLevel())
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : "Erro ao carregar skill.")
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }

    void loadSkill()
    return () => {
      cancelled = true
    }
  }, [selectedSkillId, editReloadKey, createOpen])

  useEffect(() => {
    if (createOpen) return
    if (!selectedLevel) return
    setLevelForm(mapLevelToForm(selectedLevel))
    const stats = (selectedLevel.stats ?? {}) as Record<string, unknown>
    setMetaForm((prev) => ({
      ...prev,
      name: typeof stats.name === "string" ? stats.name : "",
      description: typeof stats.description === "string" ? stats.description : "",
      category: skillCategoryValues.includes(stats.category as SkillCategory)
        ? (stats.category as SkillCategory)
        : "",
      type: skillTypeValues.includes(stats.type as SkillType) ? (stats.type as SkillType) : "",
      actionType: actionTypeValues.includes(stats.actionType as ActionType)
        ? (stats.actionType as ActionType)
        : "",
    }))
  }, [selectedLevel, createOpen])

  useEffect(() => {
    if (!abilityCategoriesEnabled) {
      setMetaForm((prev) => (prev.category ? { ...prev, category: "" } : prev))
      return
    }

    if (
      createOpen &&
      metaForm.category &&
      !enabledAbilityCategories.includes(metaForm.category)
    ) {
      setMetaForm((prev) => ({ ...prev, category: "" }))
    }
  }, [abilityCategoriesEnabled, createOpen, enabledAbilityCategories, metaForm.category])

  useEffect(() => {
    if (!createOpen && !editOpen && !filtersOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [createOpen, editOpen, filtersOpen])

  useEffect(() => {
    if (createOpen) return
    setCustomFieldModalOpen(false)
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
  }, [createOpen])

  function addCustomField() {
    const trimmed = newCustomFieldName.trim()
    if (!trimmed) {
      setError("Informe o nome do novo campo.")
      return
    }

    setLevelForm((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        {
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: trimmed,
          value: newCustomFieldValue,
        },
      ],
    }))
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
    setCustomFieldModalOpen(false)
  }

  async function createSkill() {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      if (abilityCategoriesEnabled && enabledAbilityCategories.length === 0) {
        throw new Error("Ative pelo menos uma categoria")
      }
      if (abilityCategoriesEnabled && !metaForm.category) {
        throw new Error("Categoria obrigatoria para criar habilidade.")
      }

      const payload = {
        rpgId: selectedRpgId,
        tags: metaForm.tags,
        classIds: metaForm.classIds,
        raceIds: metaForm.raceIds,
        level1: {
          levelRequired: toOptionalNumber(levelForm.levelRequired) ?? 1,
          summary: toOptionalText(levelForm.summary),
          stats: {
            name: toOptionalText(metaForm.name),
            description: toOptionalText(metaForm.description),
            notes: null,
            notesList: [],
            customFields: levelForm.customFields.map((field) => ({
              id: field.id,
              name: field.name,
              value: field.value,
            })),
            damage: toOptionalText(levelForm.damage),
            cooldown: toOptionalText(levelForm.cooldown),
            range: toOptionalText(levelForm.range),
            duration: toOptionalText(levelForm.duration),
            castTime: toOptionalText(levelForm.castTime),
            resourceCost: toOptionalText(levelForm.resourceCost),
            category: metaForm.category || null,
            type: metaForm.type || null,
            actionType: metaForm.actionType || null,
          },
          cost: {
            points: toOptionalNumber(levelForm.costPoints),
            custom: toOptionalText(levelForm.costCustom),
          },
          requirement: {
            levelRequired: toOptionalNumber(levelForm.levelRequired),
            notes: toOptionalText(levelForm.prerequisite),
          },
        },
      }

      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) {
        throw new Error(result.message ?? "Erro ao criar habilidade.")
      }
      const createdSkill = result.skill

      setCreateOpen(false)
      setEditStep(1)
      setSelectedSkillId(createdSkill.id)
      setSkills((prev) => [
        {
          id: createdSkill.id,
          slug: createdSkill.slug,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setSuccess("Habilidade criada com sucesso.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar skill.")
    } finally {
      setSaving(false)
    }
  }

  async function saveMeta(options?: { manageSaving?: boolean; showSuccess?: boolean }) {
    if (!activeSkill) return null
    const manageSaving = options?.manageSaving ?? true
    const showSuccess = options?.showSuccess ?? true
    if (manageSaving) {
      setSaving(true)
      setError("")
      setSuccess("")
    }
    try {
      if (abilityCategoriesEnabled && enabledAbilityCategories.length === 0) {
        throw new Error("Ative pelo menos uma categoria")
      }
      if (abilityCategoriesEnabled && !metaForm.category) {
        throw new Error("Categoria obrigatoria para salvar habilidade.")
      }

      const response = await fetch(`/api/skills/${activeSkill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: metaForm.tags,
          classIds: metaForm.classIds,
          raceIds: metaForm.raceIds,
        }),
      })

      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) {
        throw new Error(result.message ?? "Erro ao salvar meta.")
      }

      setActiveSkill(result.skill)
      setSkills((prev) =>
        prev.map((item) =>
          item.id === result.skill?.id
            ? {
                ...item,
                slug: result.skill.slug,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      if (showSuccess) setSuccess("Meta da skill atualizada.")
      return result.skill
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar skill.")
      return null
    } finally {
      if (manageSaving) setSaving(false)
    }
  }

  async function createSnapshotLevel() {
    if (!activeSkill) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}/levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao criar level.")
      setActiveSkill(result.skill)
      setMetaForm(mapSkillToMetaForm(result.skill))
      setSkills((prev) =>
        prev.map((item) =>
          item.id === result.skill?.id
            ? {
                ...item,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      const newestLevel = result.skill.levels[result.skill.levels.length - 1]
      setSelectedLevelId(newestLevel?.id ?? "")
      setSuccess("Novo level criado com copia profunda do level anterior.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar novo level.")
    } finally {
      setSaving(false)
    }
  }

  async function saveLevel(options?: { manageSaving?: boolean; showSuccess?: boolean }) {
    if (!activeSkill || !selectedLevel) return null
    const manageSaving = options?.manageSaving ?? true
    const showSuccess = options?.showSuccess ?? true
    if (manageSaving) {
      setSaving(true)
      setError("")
      setSuccess("")
    }
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}/levels/${selectedLevel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelRequired: toOptionalNumber(levelForm.levelRequired) ?? selectedLevel.levelRequired,
          summary: toOptionalText(levelForm.summary),
          stats: {
            name: toOptionalText(metaForm.name),
            description: toOptionalText(metaForm.description),
            notes: null,
            notesList: [],
            customFields: levelForm.customFields.map((field) => ({
              id: field.id,
              name: field.name,
              value: field.value,
            })),
            damage: toOptionalText(levelForm.damage),
            cooldown: toOptionalText(levelForm.cooldown),
            range: toOptionalText(levelForm.range),
            duration: toOptionalText(levelForm.duration),
            castTime: toOptionalText(levelForm.castTime),
            resourceCost: toOptionalText(levelForm.resourceCost),
            category: metaForm.category || null,
            type: metaForm.type || null,
            actionType: metaForm.actionType || null,
          },
          cost: {
            points: toOptionalNumber(levelForm.costPoints),
            custom: toOptionalText(levelForm.costCustom),
          },
          requirement: {
            levelRequired: toOptionalNumber(levelForm.levelRequired),
            notes: toOptionalText(levelForm.prerequisite),
          },
        }),
      })

      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao salvar level.")
      setActiveSkill(result.skill)
      if (showSuccess) setSuccess(`Level ${selectedLevel.levelNumber} atualizado.`)
      return result.skill
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar level.")
      return null
    } finally {
      if (manageSaving) setSaving(false)
    }
  }

  async function saveAll() {
    if (!activeSkill || !selectedLevel) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const savedMeta = await saveMeta({ manageSaving: false, showSuccess: false })
      if (!savedMeta) return

      const savedLevel = await saveLevel({ manageSaving: false, showSuccess: false })
      if (!savedLevel) return

      setSuccess("Habilidade atualizada.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteSelectedLevel() {
    if (!activeSkill || !selectedLevel) return
    if (activeSkill.levels.length <= 1) {
      setError("Nao e possivel remover o ultimo level da habilidade.")
      return
    }

    const shouldDelete = window.confirm(
      `Deseja deletar o level ${selectedLevel.levelNumber}? Essa acao nao pode ser desfeita.`,
    )
    if (!shouldDelete) return

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const levelNumber = selectedLevel.levelNumber
      const response = await fetch(`/api/skills/${activeSkill.id}/levels/${selectedLevel.id}`, {
        method: "DELETE",
      })

      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao remover level.")

      setActiveSkill(result.skill)
      setMetaForm(mapSkillToMetaForm(result.skill))
      setSkills((prev) =>
        prev.map((item) =>
          item.id === result.skill?.id
            ? {
                ...item,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )

      const fallbackLevel =
        result.skill.levels.find((item) => item.levelNumber === levelNumber) ??
        result.skill.levels[result.skill.levels.length - 1]
      setSelectedLevelId(fallbackLevel?.id ?? "")
      setSuccess(`Level ${levelNumber} removido.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover level.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteActiveSkill() {
    if (!activeSkill) return

    const shouldDelete = window.confirm(
      `Deseja deletar a habilidade "${activeSkill.slug}"? Essa acao nao pode ser desfeita.`,
    )
    if (!shouldDelete) return

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}`, {
        method: "DELETE",
      })
      const result = (await response.json()) as { id?: string; message?: string }
      if (!response.ok || !result.id) throw new Error(result.message ?? "Erro ao remover skill.")

      const nextSkills = skills.filter((item) => item.id !== activeSkill.id)
      setSkills(nextSkills)
      setSelectedSkillId(nextSkills[0]?.id ?? "")
      setEditOpen(nextSkills.length > 0)
      setSuccess("Habilidade removida com sucesso.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover skill.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Habilidades</p>
          <h1 className={styles.title}>{selectedRpgTitle}</h1>
        </div>
        <span className={styles.badge}>
          {skills.length} {skills.length === 1 ? "habilidade" : "habilidades"}
        </span>
      </div>
      <section className={styles.section}>
      <section className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Habilidades</h2>
            <div className={styles.sidebarTools}>
              <button
                type="button"
                className={skillSearchOpen ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                aria-label="Pesquisar habilidades"
                title="Pesquisar habilidades"
                onClick={() => {
                  setSkillSearchOpen((prev) => !prev)
                  if (skillSearchOpen) setSkillSearch("")
                }}
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                className={filtersOpen ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                aria-label="Filtrar habilidades"
                title="Filtrar habilidades"
                onClick={() => setFiltersOpen(true)}
              >
                <Filter size={18} />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Criar habilidade"
                title="Criar habilidade"
                onClick={() => {
                  setCreateOpen(true)
                  setEditOpen(false)
                  setCreateStep(1)
                  setMetaForm(createInitialMeta())
                  setLevelForm(createInitialLevel())
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          {skillSearchOpen ? (
            <label className={styles.searchBar}>
              <span>Pesquisar</span>
              <input
                type="search"
                placeholder="Nome ou description..."
                value={skillSearch}
                onChange={(event) => setSkillSearch(event.target.value)}
              />
            </label>
          ) : null}
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className={selectedSkillId === skill.id ? styles.skillCardActive : styles.skillCard}
            >
              <strong>{skillDisplayNameById[skill.id] ?? skill.slug}</strong>
              <small>{new Date(skill.updatedAt).toLocaleString("pt-BR")}</small>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => {
                    setCreateOpen(false)
                    setEditOpen(true)
                    setEditStep(1)
                    setSelectedSkillId(skill.id)
                    setEditReloadKey((prev) => prev + 1)
                  }}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
          {filteredSkills.length === 0 ? <p className={styles.muted}>Nenhuma habilidade encontrada.</p> : null}
        </aside>

        <div className={styles.editor}>
          {loading ? <p className={styles.muted}>Carregando...</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.success}>{success}</p> : null}

          {filtersOpen ? (
            <>
              <button
                type="button"
                className={styles.drawerBackdrop}
                aria-label="Fechar filtros"
                onClick={() => setFiltersOpen(false)}
              />
              <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Filtros de habilidades">
                <div className={styles.drawerHeader}>
                  <h3 className={styles.drawerTitle}>Filtros</h3>
                  <button type="button" className={styles.drawerClose} onClick={() => setFiltersOpen(false)}>
                    Fechar
                  </button>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Categoria</span>
                  <div className={styles.chipsRow}>
                    {categoryFilterOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          selectedCategoryFilters.includes(item)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedCategoryFilters((prev) =>
                            prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
                          )
                        }
                      >
                        {resolveCategoryLabel(item)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Tipo</span>
                  <div className={styles.chipsRow}>
                    {typeFilterOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          selectedTypeFilters.includes(item)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedTypeFilters((prev) =>
                            prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
                          )
                        }
                      >
                        {skillTypeLabel[item as SkillType] ?? item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Tipo da ação</span>
                  <div className={styles.chipsRow}>
                    {actionTypeFilterOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          selectedActionTypeFilters.includes(item)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedActionTypeFilters((prev) =>
                            prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
                          )
                        }
                      >
                        {actionTypeLabel[item as ActionType] ?? item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Tags</span>
                  <div className={styles.chipsRow}>
                    {tagFilterOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={
                          selectedTagFilters.includes(tag)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedTagFilters((prev) =>
                            prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
                          )
                        }
                      >
                        {skillTagLabel[tag as SkillTag] ?? tag}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.drawerClear}
                  onClick={() => {
                    setSelectedCategoryFilters([])
                    setSelectedTypeFilters([])
                    setSelectedActionTypeFilters([])
                    setSelectedTagFilters([])
                  }}
                >
                  Limpar filtros
                </button>
              </aside>
            </>
          ) : null}

          {createOpen ? (
            <div
              className={styles.modalOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Criar habilidade"
              onClick={() => setCreateOpen(false)}
            >
            <section className={`${styles.card} ${styles.modalCard}`} onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Criar</h2>
                <div className={styles.modalHeaderActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setCustomFieldModalOpen(true)}
                  >
                    novo campo
                  </button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setCreateOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
              <div className={styles.stepper}>
                {[1, 2].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={createStep === step ? styles.stepActive : styles.step}
                    onClick={() => setCreateStep(step)}
                  >
                    {step === 1 ? "Basico" : "Requerimentos"}
                  </button>
                ))}
              </div>

              {createStep === 1 ? (
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>Nome</span>
                    <input
                      value={metaForm.name}
                      onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Descricao</span>
                    <textarea
                      rows={3}
                      value={metaForm.description}
                      onChange={(event) =>
                        setMetaForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>
                  {abilityCategoriesEnabled ? (
                    <label className={styles.field}>
                      <span>Categoria</span>
                      <NativeSelectField
                        value={metaForm.category}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            category: event.target.value as SkillCategory | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {createCategoryOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                  ) : null}
                  <label className={styles.field}>
                    <span>Tipo</span>
                    <NativeSelectField
                      value={metaForm.type}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          type: event.target.value as SkillType | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {skillTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {skillTypeLabel[option]}
                        </option>
                      ))}
                    </NativeSelectField>
                  </label>
                  <label className={styles.field}>
                    <span>Tipo da ação</span>
                    <NativeSelectField
                      value={metaForm.actionType}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          actionType: event.target.value as ActionType | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {actionTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {actionTypeLabel[option]}
                        </option>
                        ))}
                      </NativeSelectField>
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Tags</span>
                      <ReactSelectField
                        classNames={{ container: () => styles.field }}
                        options={tagOptions}
                        value={tagOptions.find((option) => option.value === metaForm.tags[0]) ?? null}
                        onChange={(option) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            tags:
                              option && skillTagValues.includes(option.value as SkillTag)
                                ? [option.value as SkillTag]
                                : [],
                          }))
                        }
                        placeholder="Selecione as tags..."
                      />
                      <small className={styles.muted}>Selecione uma tag.</small>
                    </label>
                  <label className={styles.field}>
                    <span>Dano</span>
                    <input
                      value={levelForm.damage}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, damage: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Alcance</span>
                    <input
                      value={levelForm.range}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, range: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Duracao</span>
                    <input
                      value={levelForm.duration}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, duration: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Recarga</span>
                    <input
                      value={levelForm.cooldown}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, cooldown: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Tempo de conjuracao</span>
                    <input
                      value={levelForm.castTime}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, castTime: event.target.value }))}
                    />
                  </label>
                  {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
                    <p className={styles.error}>Ative pelo menos uma categoria</p>
                  ) : null}
                  {levelForm.customFields.map((field) => (
                    <label key={field.id} className={`${styles.field} ${styles.spanTwo}`}>
                      <span>{field.name}</span>
                      <input
                        value={field.value}
                        onChange={(event) =>
                          setLevelForm((prev) => ({
                            ...prev,
                            customFields: prev.customFields.map((item) =>
                              item.id === field.id ? { ...item, value: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              {createStep === 2 ? (
                <div className={styles.bindingGrid}>
                  <div className={styles.bindBox}>
                    <h3>Classes permitidas</h3>
                    {classes.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.classIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              classIds: toggleId(prev.classIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.bindBox}>
                    <h3>Racas permitidas</h3>
                    {races.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.raceIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              raceIds: toggleId(prev.raceIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <label className={styles.field}>
                    <span>Nivel minimo</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={1}
                      value={levelForm.levelRequired}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))
                      }
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Pre-requisito</span>
                    <textarea
                      rows={2}
                      value={levelForm.prerequisite}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, prerequisite: event.target.value }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              <div className={styles.actions}>
                {createStep > 1 ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setCreateStep((prev) => prev - 1)}
                  >
                    Voltar
                  </button>
                ) : null}
                {createStep < 2 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setCreateStep((prev) => prev + 1)}
                  >
                    Proxima
                  </button>
                ) : null}
                <button type="button" className={styles.primaryButton} onClick={createSkill} disabled={saving}>
                  {saving ? "Criando..." : "Criar"}
                </button>
              </div>
              {customFieldModalOpen ? (
                <div
                  className={styles.nestedModalOverlay}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Novo campo"
                  onClick={() => setCustomFieldModalOpen(false)}
                >
                  <section
                    className={`${styles.card} ${styles.nestedModalCard}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3>Novo campo</h3>
                    <label className={styles.field}>
                      <span>Nome</span>
                      <input
                        value={newCustomFieldName}
                        onChange={(event) => setNewCustomFieldName(event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Valor</span>
                      <input
                        value={newCustomFieldValue}
                        onChange={(event) => setNewCustomFieldValue(event.target.value)}
                      />
                    </label>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => {
                          setCustomFieldModalOpen(false)
                          setNewCustomFieldName("")
                          setNewCustomFieldValue("")
                        }}
                      >
                        Cancelar
                      </button>
                      <button type="button" className={styles.primaryButton} onClick={addCustomField}>
                        Criar campo
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}
            </section>
            </div>
          ) : null}

          {!createOpen && editOpen && activeSkill ? (
            <div
              className={styles.modalOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Editar habilidade"
              onClick={() => setEditOpen(false)}
            >
            <section className={`${styles.card} ${styles.modalCard}`} onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Editar</h2>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => setEditOpen(false)}
                >
                  Fechar
                </button>
              </div>
              <div className={styles.levelHeader}>
                <div className={styles.levelHeaderActions}>
                  {activeSkill.levels.length > 1 ? (
                    <NativeSelectField
                      value={selectedLevelId}
                      onChange={(event) => setSelectedLevelId(event.target.value)}
                    >
                      {activeSkill.levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          Level {level.levelNumber}
                        </option>
                      ))}
                    </NativeSelectField>
                  ) : null}
                </div>
                <div className={styles.levelHeaderActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={createSnapshotLevel}
                    disabled={saving}
                  >
                    Criar novo level
                  </button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={deleteActiveSkill}
                    disabled={saving}
                  >
                    Deletar habilidade
                  </button>
                </div>
              </div>
              <div className={styles.stepper}>
                {[1, 2].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={editStep === step ? styles.stepActive : styles.step}
                    onClick={() => setEditStep(step)}
                  >
                    {step === 1 ? "Basico" : "Requerimentos"}
                  </button>
                ))}
              </div>

              {editStep === 1 ? (
                <>
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Nome</span>
                      <input
                        value={metaForm.name}
                        onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Descricao</span>
                      <textarea
                        rows={3}
                        value={metaForm.description}
                        onChange={(event) =>
                          setMetaForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </label>
                    {abilityCategoriesEnabled ? (
                      <label className={styles.field}>
                        <span>Categoria</span>
                        <NativeSelectField
                          value={metaForm.category}
                          onChange={(event) =>
                            setMetaForm((prev) => ({
                              ...prev,
                              category: event.target.value as SkillCategory | "",
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {editCategoryOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </NativeSelectField>
                      </label>
                    ) : null}
                    <label className={styles.field}>
                      <span>Tipo</span>
                      <NativeSelectField
                        value={metaForm.type}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            type: event.target.value as SkillType | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {skillTypeValues.map((option) => (
                          <option key={option} value={option}>
                            {skillTypeLabel[option]}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                    <label className={styles.field}>
                      <span>Tipo da ação</span>
                      <NativeSelectField
                        value={metaForm.actionType}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            actionType: event.target.value as ActionType | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {actionTypeValues.map((option) => (
                          <option key={option} value={option}>
                            {actionTypeLabel[option]}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Tags</span>
                      <ReactSelectField
                        classNames={{ container: () => styles.field }}
                        options={tagOptions}
                        value={tagOptions.find((option) => option.value === metaForm.tags[0]) ?? null}
                        onChange={(option) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            tags:
                              option && skillTagValues.includes(option.value as SkillTag)
                                ? [option.value as SkillTag]
                                : [],
                          }))
                        }
                        placeholder="Selecione as tags..."
                      />
                      <small className={styles.muted}>Selecione uma tag.</small>
                    </label>
                    <label className={styles.field}>
                      <span>Dano</span>
                      <input
                        value={levelForm.damage}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, damage: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Alcance</span>
                      <input
                        value={levelForm.range}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, range: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Duracao</span>
                      <input
                        value={levelForm.duration}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, duration: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Recarga</span>
                      <input
                        value={levelForm.cooldown}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, cooldown: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Tempo de conjuracao</span>
                      <input
                        value={levelForm.castTime}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, castTime: event.target.value }))}
                      />
                    </label>
                    {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
                      <p className={styles.error}>Ative pelo menos uma categoria</p>
                    ) : null}
                    {levelForm.customFields.map((field) => (
                      <label key={field.id} className={`${styles.field} ${styles.spanTwo}`}>
                        <span>{field.name}</span>
                        <input
                          value={field.value}
                          onChange={(event) =>
                            setLevelForm((prev) => ({
                              ...prev,
                              customFields: prev.customFields.map((item) =>
                                item.id === field.id ? { ...item, value: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>

                </>
              ) : null}

              {editStep >= 2 ? (
                <div className={styles.levelHeader}>
                  <h3>Editor de Levels</h3>
                  <div className={styles.levelHeaderActions}>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={deleteSelectedLevel}
                      disabled={saving || activeSkill.levels.length <= 1}
                    >
                      Deletar level
                    </button>
                  </div>
                </div>
              ) : null}

              {editStep === 2 ? (
                <div className={styles.bindingGrid}>
                  <div className={styles.bindBox}>
                    <h3>Classes permitidas</h3>
                    {classes.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.classIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              classIds: toggleId(prev.classIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.bindBox}>
                    <h3>Racas permitidas</h3>
                    {races.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.raceIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              raceIds: toggleId(prev.raceIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <label className={styles.field}>
                    <span>Nivel minimo</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={1}
                      value={levelForm.levelRequired}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))
                      }
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Pre-requisito</span>
                    <textarea
                      rows={2}
                      value={levelForm.prerequisite}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, prerequisite: event.target.value }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              <div className={styles.actions}>
                {editStep > 1 ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setEditStep((prev) => prev - 1)}
                  >
                    Voltar
                  </button>
                ) : null}
                {editStep < 2 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setEditStep((prev) => prev + 1)}
                  >
                    Proxima
                  </button>
                ) : null}
                <button type="button" className={styles.primaryButton} onClick={saveAll} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </section>
            </div>
          ) : null}

        </div>
      </section>
      </section>
    </main>
  )
}


