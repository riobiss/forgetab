import { useEffect, type Dispatch, type SetStateAction } from "react"
import {
  buildSkillsSearchIndex,
  loadDashboardData,
  loadSkillDetail,
  parseSearchIndex,
} from "@/application/skillsDashboard/use-cases/skillsDashboard"
import type { SkillsDashboardDependencies } from "@/application/skillsDashboard/contracts/SkillsDashboardDependencies"
import { normalizeEnabledAbilityCategories } from "@/lib/rpg/abilityCategories"
import type { SkillCategory } from "@/types/skillBuilder"
import type {
  LevelForm,
  MetaForm,
  SkillDetail,
  SkillListItem,
  TemplateOption,
} from "./types"
import {
  createInitialLevel,
  createInitialMeta,
  mapLevelToForm,
  mapSkillToMetaForm,
} from "./utils"

type UseSkillsDataControllerParams = {
  deps: SkillsDashboardDependencies
  selectedRpgId: string
  skills: SkillListItem[]
  selectedSkillId: string
  editReloadKey: number
  createOpen: boolean
  setClasses: Dispatch<SetStateAction<TemplateOption[]>>
  setRaces: Dispatch<SetStateAction<TemplateOption[]>>
  setSkills: Dispatch<SetStateAction<SkillListItem[]>>
  setSkillSearchIndex: Dispatch<SetStateAction<Record<string, string>>>
  setSkillDisplayNameById: Dispatch<SetStateAction<Record<string, string>>>
  setSkillFilterMetaById: Dispatch<
    SetStateAction<Record<string, { categories: string[]; types: string[]; actionTypes: string[]; tags: string[] }>>
  >
  setSelectedSkillId: Dispatch<SetStateAction<string>>
  setActiveSkill: Dispatch<SetStateAction<SkillDetail | null>>
  setSelectedLevelId: Dispatch<SetStateAction<string>>
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  setCostResourceName: Dispatch<SetStateAction<string>>
  setAbilityCategoriesEnabled: Dispatch<SetStateAction<boolean>>
  setEnabledAbilityCategories: Dispatch<SetStateAction<SkillCategory[]>>
  setEditOpen: Dispatch<SetStateAction<boolean>>
  setLoading: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string>>
}

export function useSkillsDataController({
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
}: UseSkillsDataControllerParams) {
  useEffect(() => {
    if (!selectedRpgId) return

    async function loadData() {
      setLoading(true)
      setError("")
      try {
        const payload = await loadDashboardData(deps, { rpgId: selectedRpgId })
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
  }, [
    deps,
    selectedRpgId,
    setAbilityCategoriesEnabled,
    setClasses,
    setCostResourceName,
    setEditOpen,
    setEnabledAbilityCategories,
    setError,
    setLoading,
    setRaces,
    setSelectedSkillId,
    setSkills,
  ])

  useEffect(() => {
    if (skills.length === 0) {
      setSkillSearchIndex({})
      setSkillDisplayNameById({})
      setSkillFilterMetaById({})
      return
    }

    let cancelled = false

    async function buildSearchIndexEffect() {
      try {
        const index = await buildSkillsSearchIndex(deps, {
          skills,
          rpgId: selectedRpgId,
        })
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

    void buildSearchIndexEffect()
    return () => {
      cancelled = true
    }
  }, [
    deps,
    selectedRpgId,
    setSkillDisplayNameById,
    setSkillFilterMetaById,
    setSkillSearchIndex,
    skills,
  ])

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
        const skill = await loadSkillDetail(deps, { skillId: selectedSkillId })

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
  }, [
    createOpen,
    deps,
    editReloadKey,
    selectedSkillId,
    setActiveSkill,
    setError,
    setLevelForm,
    setLoading,
    setMetaForm,
    setSelectedLevelId,
  ])
}
