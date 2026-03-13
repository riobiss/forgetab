import { useEffect, useMemo, useState } from "react"
import type { SkillsDashboardDependencies } from "@/application/skillsDashboard/contracts/SkillsDashboardDependencies"
import { type ReactSelectOption } from "@/components/select/ReactSelectField"
import { abilityCategoryDefinitions } from "@/lib/rpg/abilityCategories"
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
import { useSkillsDataController } from "./useSkillsDataController"
import { useSkillsFilters } from "./useSkillsFilters"
import { useSkillsModalController } from "./useSkillsModalController"
import { useSkillsDashboardActions } from "./useSkillsDashboardActions"
import {
  createInitialLevel,
  mapLevelToForm,
  createInitialMeta,
  resolveCategoryLabel,
} from "./utils"

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
  params: Pick<SkillsDashboardProps, "ownedRpgs" | "initialRpgId"> & {
    deps: SkillsDashboardDependencies
  },
): SkillsDashboardState {
  const { ownedRpgs, initialRpgId, deps } = params
  const initialSelection =
    initialRpgId && ownedRpgs.some((item) => item.id === initialRpgId)
      ? initialRpgId
      : (ownedRpgs[0]?.id ?? "")
  const [selectedRpgId] = useState(initialSelection)
  const [classes, setClasses] = useState<TemplateOption[]>([])
  const [races, setRaces] = useState<TemplateOption[]>([])
  const [skills, setSkills] = useState<SkillListItem[]>([])
  const [skillSearchIndex, setSkillSearchIndex] = useState<Record<string, string>>({})
  const [skillDisplayNameById, setSkillDisplayNameById] = useState<Record<string, string>>({})
  const [skillFilterMetaById, setSkillFilterMetaById] = useState<
    Record<string, { categories: string[]; types: string[]; actionTypes: string[]; tags: string[] }>
  >({})
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [activeSkill, setActiveSkill] = useState<SkillDetail | null>(null)
  const [selectedLevelId, setSelectedLevelId] = useState("")
  const [metaForm, setMetaForm] = useState<MetaForm>(createInitialMeta())
  const [levelForm, setLevelForm] = useState<LevelForm>(createInitialLevel())
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [abilityCategoriesEnabled, setAbilityCategoriesEnabled] = useState(false)
  const [enabledAbilityCategories, setEnabledAbilityCategories] = useState<SkillCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const {
    skillSearchOpen,
    skillSearch,
    setSkillSearch,
    filtersOpen,
    selectedCategoryFilters,
    selectedTypeFilters,
    selectedActionTypeFilters,
    selectedTagFilters,
    filteredSkills,
    toggleSkillSearch,
    openFilters,
    closeFilters,
    clearFilters,
    toggleCategoryFilter,
    toggleTypeFilter,
    toggleActionTypeFilter,
    toggleTagFilter,
  } = useSkillsFilters({ skills, skillSearchIndex, skillFilterMetaById })
  const {
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
    editReloadKey,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openCustomFieldModal,
    closeCustomFieldModal,
  } = useSkillsModalController({
    setMetaForm,
    setLevelForm,
    createInitialMeta,
    createInitialLevel,
    filtersOpen,
  })

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
  useSkillsDataController({
    deps,
    selectedRpgId,
    skills,
    selectedSkillId,
    editReloadKey,
    createOpen,
    setClasses,
    setRaces,
    setSkills,
    setSkillSearchIndex,
    setSkillDisplayNameById,
    setSkillFilterMetaById,
    setSelectedSkillId,
    setActiveSkill,
    setSelectedLevelId,
    setMetaForm,
    setLevelForm,
    setCostResourceName,
    setAbilityCategoriesEnabled,
    setEnabledAbilityCategories,
    setEditOpen,
    setLoading,
    setError,
  })

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

  const actions = useSkillsDashboardActions({
    deps,
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
    openEditModal: (skillId: string) => openEditModal(skillId, setSelectedSkillId),
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
