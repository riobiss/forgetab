import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  actionTypeValues,
  skillCategoryValues,
  skillTypeValues,
  type ActionType,
  type SkillCategory,
  type SkillType
} from "@forgetab/world-contracts/skill-builder"
import type { LevelForm, MetaForm, SkillLevel } from "./types"
import { mapLevelToForm } from "./utils"

export function useSkillFormSynchronization(params: {
  selectedLevel: SkillLevel | null
  createOpen: boolean
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  metaFormCategory: SkillCategory | ""
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
}) {
  const {
    selectedLevel,
    createOpen,
    abilityCategoriesEnabled,
    enabledAbilityCategories,
    metaFormCategory,
    setMetaForm,
    setLevelForm
  } = params

  useEffect(() => {
    if (createOpen || !selectedLevel) return
    setLevelForm(mapLevelToForm(selectedLevel))
    const stats = (selectedLevel.stats ?? {}) as Record<string, unknown>
    setMetaForm((current) => ({
      ...current,
      name: typeof stats.name === "string" ? stats.name : "",
      description:
        typeof stats.description === "string" ? stats.description : "",
      category: skillCategoryValues.includes(stats.category as SkillCategory)
        ? (stats.category as SkillCategory)
        : "",
      type: skillTypeValues.includes(stats.type as SkillType)
        ? (stats.type as SkillType)
        : "",
      actionType: actionTypeValues.includes(stats.actionType as ActionType)
        ? (stats.actionType as ActionType)
        : ""
    }))
  }, [
    createOpen,
    selectedLevel,
    setLevelForm,
    setMetaForm
  ])

  useEffect(() => {
    if (!abilityCategoriesEnabled) {
      setMetaForm((current) =>
        current.category ? { ...current, category: "" } : current
      )
      return
    }
    if (
      createOpen &&
      metaFormCategory &&
      !enabledAbilityCategories.includes(metaFormCategory)
    ) {
      setMetaForm((current) => ({ ...current, category: "" }))
    }
  }, [
    abilityCategoriesEnabled,
    createOpen,
    enabledAbilityCategories,
    metaFormCategory,
    setMetaForm
  ])
}
