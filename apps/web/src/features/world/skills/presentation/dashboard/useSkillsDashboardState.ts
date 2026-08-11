import { useState } from "react"
import type { SkillsDashboardDependencies } from "@/features/world/skills/application/skillsDashboard/contracts/SkillsDashboardDependencies"
import { type SkillCategory } from "@forgetab/world-contracts/skill-builder"
import type {
  LevelForm,
  MetaForm,
  SkillDetail,
  SkillListItem,
  SkillsDashboardProps,
  TemplateOption
} from "./types"
import { useSkillsDataController } from "./useSkillsDataController"
import { useSkillsFilters } from "./useSkillsFilters"
import { useSkillsModalController } from "./useSkillsModalController"
import { useSkillsDashboardActions } from "./useSkillsDashboardActions"
import { useSkillsDashboardDerivedState } from "./useSkillsDashboardDerivedState"
import { useSkillFormSynchronization } from "./useSkillFormSynchronization"
import { createInitialLevel, createInitialMeta } from "./utils"

export function useSkillsDashboardState(
  params: Pick<SkillsDashboardProps, "ownedRpgs" | "initialRpgId"> & {
    deps: SkillsDashboardDependencies
  }
) {
  const { ownedRpgs, initialRpgId, deps } = params
  const initialSelection =
    initialRpgId && ownedRpgs.some((item) => item.id === initialRpgId)
      ? initialRpgId
      : (ownedRpgs[0]?.id ?? "")
  const [selectedRpgId] = useState(initialSelection)
  const [classes, setClasses] = useState<TemplateOption[]>([])
  const [races, setRaces] = useState<TemplateOption[]>([])
  const [skills, setSkills] = useState<SkillListItem[]>([])
  const [skillSearchIndex, setSkillSearchIndex] = useState<
    Record<string, string>
  >({})
  const [skillDisplayNameById, setSkillDisplayNameById] = useState<
    Record<string, string>
  >({})
  const [skillFilterMetaById, setSkillFilterMetaById] = useState<
    Record<
      string,
      {
        categories: string[]
        types: string[]
        actionTypes: string[]
        tags: string[]
      }
    >
  >({})
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [activeSkill, setActiveSkill] = useState<SkillDetail | null>(null)
  const [selectedLevelId, setSelectedLevelId] = useState("")
  const [metaForm, setMetaForm] = useState<MetaForm>(createInitialMeta())
  const [levelForm, setLevelForm] = useState<LevelForm>(createInitialLevel())
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [abilityCategoriesEnabled, setAbilityCategoriesEnabled] =
    useState(false)
  const [enabledAbilityCategories, setEnabledAbilityCategories] = useState<
    SkillCategory[]
  >([])
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
    toggleTagFilter
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
    closeCustomFieldModal
  } = useSkillsModalController({
    setMetaForm,
    setLevelForm,
    createInitialMeta,
    createInitialLevel,
    filtersOpen
  })

  const derived = useSkillsDashboardDerivedState({
    activeSkill,
    selectedLevelId,
    abilityCategoriesEnabled,
    enabledAbilityCategories,
    metaForm,
    ownedRpgs,
    selectedRpgId,
    skillFilterMetaById
  })
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
    setError
  })

  useSkillFormSynchronization({
    selectedLevel: derived.selectedLevel,
    createOpen,
    abilityCategoriesEnabled,
    enabledAbilityCategories,
    metaFormCategory: metaForm.category,
    setMetaForm,
    setLevelForm
  })

  const actions = useSkillsDashboardActions({
    deps,
    selectedRpgId,
    skills,
    activeSkill,
    selectedLevel: derived.selectedLevel,
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
    setCustomFieldModalOpen
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
    openEditModal: (skillId: string) =>
      openEditModal(skillId, setSelectedSkillId),
    closeEditModal,
    createStep,
    setCreateStep,
    editStep,
    setEditStep,
    loading,
    saving,
    error,
    success,
    createCategoryOptions: derived.createCategoryOptions,
    editCategoryOptions: derived.editCategoryOptions,
    tagOptions: derived.tagOptions,
    selectedRpgTitle: derived.selectedRpgTitle,
    categoryFilterOptions: derived.categoryFilterOptions,
    typeFilterOptions: derived.typeFilterOptions,
    actionTypeFilterOptions: derived.actionTypeFilterOptions,
    tagFilterOptions: derived.tagFilterOptions,
    filteredSkills,
    addCustomField: actions.addCustomField,
    createSkill: actions.createSkill,
    createSnapshotLevel: actions.createSnapshotLevel,
    saveAll: actions.saveAll,
    deleteSelectedLevel: actions.deleteSelectedLevel,
    deleteActiveSkill: actions.deleteActiveSkill
  }
}
