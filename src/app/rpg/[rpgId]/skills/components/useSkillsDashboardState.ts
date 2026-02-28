import { useEffect, useMemo, useState } from "react"
import { type ReactSelectOption } from "@/components/select/ReactSelectField"
import {
  abilityCategoryDefinitions,
  normalizeEnabledAbilityCategories,
} from "@/lib/rpg/abilityCategories"
import {
  actionTypeValues,
  skillCategoryValues,
  skillTagValues,
  skillTypeValues,
  type ActionType,
  type SkillCategory,
  type SkillType,
} from "@/types/skillBuilder"
import { skillTagLabel } from "./constants"
import type {
  LevelForm,
  MetaForm,
  RpgSettingsPayload,
  SkillDetail,
  SkillListItem,
  SkillsDashboardProps,
  TemplateOption,
} from "./types"
import {
  createInitialLevel,
  createInitialMeta,
  mapLevelToForm,
  mapSkillToMetaForm,
  resolveCategoryLabel,
  toOptionalNumber,
  toOptionalText,
} from "./utils"

export function useSkillsDashboardState(params: Pick<SkillsDashboardProps, "ownedRpgs" | "initialRpgId">) {
  const { ownedRpgs, initialRpgId } = params
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
              }
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
            }
          }),
        )

        if (cancelled) return
        setSkillSearchIndex(Object.fromEntries(entries.map((item) => [item.id, item.searchBlob])))
        setSkillDisplayNameById(Object.fromEntries(entries.map((item) => [item.id, item.displayName])))
        setSkillFilterMetaById(Object.fromEntries(entries.map((item) => [item.id, item.filters])))
      } catch {
        if (cancelled) return
        setSkillSearchIndex(
          Object.fromEntries(skills.map((skill) => [skill.id, skill.slug.toLowerCase()])),
        )
        setSkillDisplayNameById(
          Object.fromEntries(skills.map((skill) => [skill.id, skill.slug])),
        )
        setSkillFilterMetaById(
          Object.fromEntries(
            skills.map((skill) => [
              skill.id,
              { categories: [], types: [], actionTypes: [], tags: [] },
            ]),
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



  return {
    classes,
    races,
    skills,
    skillSearchOpen,
    setSkillSearchOpen,
    skillSearch,
    setSkillSearch,
    skillDisplayNameById,
    filtersOpen,
    setFiltersOpen,
    selectedCategoryFilters,
    setSelectedCategoryFilters,
    selectedTypeFilters,
    setSelectedTypeFilters,
    selectedActionTypeFilters,
    setSelectedActionTypeFilters,
    selectedTagFilters,
    setSelectedTagFilters,
    selectedSkillId,
    setSelectedSkillId,
    activeSkill,
    setActiveSkill,
    selectedLevelId,
    setSelectedLevelId,
    metaForm,
    setMetaForm,
    levelForm,
    setLevelForm,
    abilityCategoriesEnabled,
    enabledAbilityCategories,
    createOpen,
    setCreateOpen,
    customFieldModalOpen,
    setCustomFieldModalOpen,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    editOpen,
    setEditOpen,
    createStep,
    setCreateStep,
    editStep,
    setEditStep,
    setEditReloadKey,
    loading,
    saving,
    error,
    success,
    selectedLevel,
    createCategoryOptions,
    editCategoryOptions,
    tagOptions,
    selectedRpgTitle,
    categoryFilterOptions,
    typeFilterOptions,
    actionTypeFilterOptions,
    tagFilterOptions,
    filteredSkills,
    addCustomField,
    createSkill,
    saveMeta,
    createSnapshotLevel,
    saveLevel,
    saveAll,
    deleteSelectedLevel,
    deleteActiveSkill,
  }
}
