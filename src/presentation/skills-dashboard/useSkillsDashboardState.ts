import { useEffect, useMemo, useState } from "react"
import {
  buildSkillsSearchIndex,
  loadDashboardData,
  loadSkillDetail,
  parseSearchIndex,
} from "@/application/skillsDashboard/use-cases/skillsDashboard"
import { type ReactSelectOption } from "@/components/select/ReactSelectField"
import { httpSkillsDashboardGateway } from "@/infrastructure/skillsDashboard/gateways/httpSkillsDashboardGateway"
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
  SkillDetail,
  SkillListItem,
  SkillsDashboardProps,
  TemplateOption,
} from "./types"
import { useSkillsDashboardActions } from "./useSkillsDashboardActions"
import {
  createInitialLevel,
  createInitialMeta,
  mapLevelToForm,
  mapSkillToMetaForm,
  resolveCategoryLabel,
} from "./utils"

const skillsDashboardReadDeps = { gateway: httpSkillsDashboardGateway }

export type SkillsDashboardState = {
  classes: TemplateOption[]
  races: TemplateOption[]
  skills: SkillListItem[]
  skillSearchOpen: boolean
  skillSearch: string
  setSkillSearch: (value: string) => void
  skillDisplayNameById: Record<string, string>
  filtersOpen: boolean
  selectedCategoryFilters: string[]
  selectedTypeFilters: string[]
  selectedActionTypeFilters: string[]
  selectedTagFilters: string[]
  toggleSkillSearch: () => void
  openFilters: () => void
  closeFilters: () => void
  clearFilters: () => void
  toggleCategoryFilter: (item: string) => void
  toggleTypeFilter: (item: string) => void
  toggleActionTypeFilter: (item: string) => void
  toggleTagFilter: (tag: string) => void
  selectedSkillId: string
  activeSkill: SkillDetail | null
  selectedLevelId: string
  setSelectedLevelId: (value: string | ((prev: string) => string)) => void
  metaForm: MetaForm
  setMetaForm: (value: MetaForm | ((prev: MetaForm) => MetaForm)) => void
  levelForm: LevelForm
  setLevelForm: (value: LevelForm | ((prev: LevelForm) => LevelForm)) => void
  costResourceName: string
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  createOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void
  customFieldModalOpen: boolean
  openCustomFieldModal: () => void
  closeCustomFieldModal: () => void
  newCustomFieldName: string
  setNewCustomFieldName: (value: string | ((prev: string) => string)) => void
  newCustomFieldValue: string
  setNewCustomFieldValue: (value: string | ((prev: string) => string)) => void
  editOpen: boolean
  openEditModal: (skillId: string) => void
  closeEditModal: () => void
  createStep: number
  setCreateStep: (value: number | ((prev: number) => number)) => void
  editStep: number
  setEditStep: (value: number | ((prev: number) => number)) => void
  loading: boolean
  saving: boolean
  error: string
  success: string
  createCategoryOptions: Array<{ key: string; label: string; description: string }>
  editCategoryOptions: Array<{ key: string; label: string; description: string }>
  tagOptions: ReactSelectOption[]
  selectedRpgTitle: string
  categoryFilterOptions: string[]
  typeFilterOptions: string[]
  actionTypeFilterOptions: string[]
  tagFilterOptions: string[]
  filteredSkills: SkillListItem[]
  addCustomField: () => void
  createSkill: () => Promise<void>
  createSnapshotLevel: () => Promise<void>
  saveAll: () => Promise<void>
  deleteSelectedLevel: () => Promise<void>
  deleteActiveSkill: () => Promise<void>
}

export function useSkillsDashboardState(
  params: Pick<SkillsDashboardProps, "ownedRpgs" | "initialRpgId">,
): SkillsDashboardState {
  const { ownedRpgs, initialRpgId } = params
  const initialSelection =
    initialRpgId && ownedRpgs.some((item) => item.id === initialRpgId)
      ? initialRpgId
      : (ownedRpgs[0]?.id ?? "")
  const [selectedRpgId] = useState(initialSelection)
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
  const [costResourceName, setCostResourceName] = useState("Skill Points")
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

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.innerWidth > 760) {
      setSkillSearchOpen(true)
    }
  }, [])

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
        const payload = await loadDashboardData(skillsDashboardReadDeps, { rpgId: selectedRpgId })
        setClasses(payload.classes)
        setRaces(payload.races)
        setSkills(payload.skills)
        setCostResourceName((payload.rpgSettings.costResourceName ?? "Skill Points").trim() || "Skill Points")
        setAbilityCategoriesEnabled(Boolean(payload.rpgSettings.abilityCategoriesEnabled ?? false))
        setEnabledAbilityCategories(
          normalizeEnabledAbilityCategories(payload.rpgSettings.enabledAbilityCategories),
        )
        setSelectedSkillId(payload.skills[0]?.id ?? "")
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
        const index = await buildSkillsSearchIndex(skillsDashboardReadDeps, { skills })
        if (cancelled) return
        const parsed = parseSearchIndex(index)
        setSkillSearchIndex(parsed.skillSearchIndex)
        setSkillDisplayNameById(parsed.skillDisplayNameById)
        setSkillFilterMetaById(parsed.skillFilterMetaById)
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
        const skill = await loadSkillDetail(skillsDashboardReadDeps, { skillId: selectedSkillId })

        if (cancelled) return
        setActiveSkill(skill as SkillDetail)
        setMetaForm(mapSkillToMetaForm(skill as SkillDetail))
        const firstLevel = skill.levels[0]
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

  function toggleSkillSearch() {
    setSkillSearchOpen((prev) => {
      const next = !prev
      if (!next) {
        setSkillSearch("")
      }
      return next
    })
  }

  function openFilters() {
    setFiltersOpen(true)
  }

  function closeFilters() {
    setFiltersOpen(false)
  }

  function clearFilters() {
    setSelectedCategoryFilters([])
    setSelectedTypeFilters([])
    setSelectedActionTypeFilters([])
    setSelectedTagFilters([])
  }

  function toggleCategoryFilter(item: string) {
    setSelectedCategoryFilters((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    )
  }

  function toggleTypeFilter(item: string) {
    setSelectedTypeFilters((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    )
  }

  function toggleActionTypeFilter(item: string) {
    setSelectedActionTypeFilters((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    )
  }

  function toggleTagFilter(tag: string) {
    setSelectedTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
  }

  function openCreateModal() {
    setCreateOpen(true)
    setEditOpen(false)
    setCreateStep(1)
    setMetaForm(createInitialMeta())
    setLevelForm(createInitialLevel())
  }

  function closeCreateModal() {
    setCreateOpen(false)
  }

  function openEditModal(skillId: string) {
    setCreateOpen(false)
    setEditOpen(true)
    setEditStep(1)
    setSelectedSkillId(skillId)
    setEditReloadKey((prev) => prev + 1)
  }

  function closeEditModal() {
    setEditOpen(false)
  }

  function openCustomFieldModal() {
    setCustomFieldModalOpen(true)
  }

  function closeCustomFieldModal() {
    setCustomFieldModalOpen(false)
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
  }

  const actions = useSkillsDashboardActions({
    selectedRpgId,
    skills,
    activeSkill,
    selectedLevel,
    metaForm,
    levelForm,
    abilityCategoriesEnabled,
    enabledAbilityCategories,
    newCustomFieldName,
    newCustomFieldValue,
    setSaving,
    setError,
    setSuccess,
    setCreateOpen,
    setEditOpen,
    setEditStep,
    setSelectedSkillId,
    setSkills,
    setActiveSkill,
    setMetaForm,
    setLevelForm,
    setSelectedLevelId,
    setNewCustomFieldName,
    setNewCustomFieldValue,
    setCustomFieldModalOpen,
  })



  return {
    classes,
    races,
    skills,
    skillSearchOpen,
    skillSearch,
    setSkillSearch,
    skillDisplayNameById,
    filtersOpen,
    selectedCategoryFilters,
    selectedTypeFilters,
    selectedActionTypeFilters,
    selectedTagFilters,
    toggleSkillSearch,
    openFilters,
    closeFilters,
    clearFilters,
    toggleCategoryFilter,
    toggleTypeFilter,
    toggleActionTypeFilter,
    toggleTagFilter,
    selectedSkillId,
    activeSkill,
    selectedLevelId,
    setSelectedLevelId,
    metaForm,
    setMetaForm,
    levelForm,
    setLevelForm,
    costResourceName,
    abilityCategoriesEnabled,
    enabledAbilityCategories,
    createOpen,
    openCreateModal,
    closeCreateModal,
    customFieldModalOpen,
    openCustomFieldModal,
    closeCustomFieldModal,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    editOpen,
    openEditModal,
    closeEditModal,
    createStep,
    setCreateStep,
    editStep,
    setEditStep,
    loading,
    saving,
    error,
    success,
    createCategoryOptions,
    editCategoryOptions,
    tagOptions,
    selectedRpgTitle,
    categoryFilterOptions,
    typeFilterOptions,
    actionTypeFilterOptions,
    tagFilterOptions,
    filteredSkills,
    addCustomField: actions.addCustomField,
    createSkill: actions.createSkill,
    createSnapshotLevel: actions.createSnapshotLevel,
    saveAll: actions.saveAll,
    deleteSelectedLevel: actions.deleteSelectedLevel,
    deleteActiveSkill: actions.deleteActiveSkill,
  }
}
