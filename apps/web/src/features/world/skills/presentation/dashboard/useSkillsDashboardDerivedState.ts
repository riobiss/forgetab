import { useMemo } from "react"
import type { ReactSelectOption } from "@/components/select/types"
import { abilityCategoryDefinitions } from "@forgetab/world-contracts/rpg/abilityCategories"
import {
  actionTypeValues,
  skillCategoryValues,
  skillTagValues,
  skillTypeValues,
  type SkillCategory
} from "@forgetab/world-contracts/skill-builder"
import { skillTagLabel } from "./constants"
import type { MetaForm, SkillDetail, SkillsDashboardProps } from "./types"
import { resolveCategoryLabel } from "./utils"

export function useSkillsDashboardDerivedState(params: {
  activeSkill: SkillDetail | null
  selectedLevelId: string
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  metaForm: MetaForm
  ownedRpgs: SkillsDashboardProps["ownedRpgs"]
  selectedRpgId: string
  skillFilterMetaById: Record<
    string,
    {
      categories: string[]
      types: string[]
      actionTypes: string[]
      tags: string[]
    }
  >
}) {
  const selectedLevel = useMemo(
    () =>
      params.activeSkill?.levels.find(
        (level) => level.id === params.selectedLevelId
      ) ?? null,
    [params.activeSkill, params.selectedLevelId]
  )
  const createCategoryOptions = useMemo(
    () =>
      abilityCategoryDefinitions.filter(
        (option) =>
          !params.abilityCategoriesEnabled ||
          params.enabledAbilityCategories.includes(option.key as SkillCategory)
      ),
    [params.abilityCategoriesEnabled, params.enabledAbilityCategories]
  )
  const editCategoryOptions = useMemo(() => {
    if (
      !params.metaForm.category ||
      createCategoryOptions.some(
        (option) => option.key === params.metaForm.category
      )
    ) {
      return createCategoryOptions
    }
    return [
      ...createCategoryOptions,
      {
        key: params.metaForm.category,
        label: `${resolveCategoryLabel(params.metaForm.category)} (indisponivel)`,
        description: ""
      }
    ]
  }, [createCategoryOptions, params.metaForm.category])
  const tagOptions = useMemo<ReactSelectOption[]>(
    () =>
      skillTagValues.map((tag) => ({ value: tag, label: skillTagLabel[tag] })),
    []
  )
  const selectedRpgTitle = useMemo(
    () =>
      params.ownedRpgs.find((item) => item.id === params.selectedRpgId)
        ?.title ?? "Habilidades",
    [params.ownedRpgs, params.selectedRpgId]
  )
  const tagFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(params.skillFilterMetaById)
            .flatMap((item) => item.tags)
            .filter(Boolean)
        )
      ),
    [params.skillFilterMetaById]
  )

  return {
    selectedLevel,
    createCategoryOptions,
    editCategoryOptions,
    tagOptions,
    selectedRpgTitle,
    categoryFilterOptions: [...skillCategoryValues],
    typeFilterOptions: [...skillTypeValues],
    actionTypeFilterOptions: [...actionTypeValues],
    tagFilterOptions
  }
}
