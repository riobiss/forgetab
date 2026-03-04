import type { Dispatch, SetStateAction } from "react"
import {
  mapCreateSkillPayload,
  mapUpdateSkillLevelPayload,
  mapUpdateSkillMetaPayload,
} from "@/application/skillsDashboard/mappers/skillPayloadMappers"
import {
  createSkillLevelSnapshotUseCase,
  createSkillUseCase,
  deleteSkillLevelUseCase,
  deleteSkillUseCase,
  updateSkillLevelUseCase,
  updateSkillMetaUseCase,
} from "@/application/skillsDashboard/use-cases/skillsDashboard"
import { httpSkillsDashboardGateway } from "@/infrastructure/skillsDashboard/gateways/httpSkillsDashboardGateway"
import type { SkillCategory } from "@/types/skillBuilder"
import type { LevelForm, MetaForm, SkillDetail, SkillLevel, SkillListItem } from "./types"
import { mapSkillToMetaForm } from "./utils"

const skillsDashboardDeps = { gateway: httpSkillsDashboardGateway }

type UseSkillsDashboardActionsParams = {
  selectedRpgId: string
  skills: SkillListItem[]
  activeSkill: SkillDetail | null
  selectedLevel: SkillLevel | null
  metaForm: MetaForm
  levelForm: LevelForm
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  newCustomFieldName: string
  newCustomFieldValue: string
  setSaving: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string>>
  setSuccess: Dispatch<SetStateAction<string>>
  setCreateOpen: Dispatch<SetStateAction<boolean>>
  setEditOpen: Dispatch<SetStateAction<boolean>>
  setEditStep: Dispatch<SetStateAction<number>>
  setSelectedSkillId: Dispatch<SetStateAction<string>>
  setSkills: Dispatch<SetStateAction<SkillListItem[]>>
  setActiveSkill: Dispatch<SetStateAction<SkillDetail | null>>
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  setSelectedLevelId: Dispatch<SetStateAction<string>>
  setNewCustomFieldName: Dispatch<SetStateAction<string>>
  setNewCustomFieldValue: Dispatch<SetStateAction<string>>
  setCustomFieldModalOpen: Dispatch<SetStateAction<boolean>>
}

type SaveOptions = { manageSaving?: boolean; showSuccess?: boolean }

export function useSkillsDashboardActions(params: UseSkillsDashboardActionsParams) {
  async function saveMeta(options?: SaveOptions) {
    const {
      activeSkill,
      abilityCategoriesEnabled,
      enabledAbilityCategories,
      metaForm,
      setSaving,
      setError,
      setSuccess,
      setActiveSkill,
      setSkills,
    } = params
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

      const updatedSkill = (await updateSkillMetaUseCase(skillsDashboardDeps, {
        skillId: activeSkill.id,
        payload: mapUpdateSkillMetaPayload(metaForm),
      })) as SkillDetail

      setActiveSkill(updatedSkill)
      setSkills((prev) =>
        prev.map((item) =>
          item.id === updatedSkill.id
            ? {
                ...item,
                slug: updatedSkill.slug,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      if (showSuccess) setSuccess("Meta da skill atualizada.")
      return updatedSkill
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar skill.")
      return null
    } finally {
      if (manageSaving) setSaving(false)
    }
  }

  async function saveLevel(options?: SaveOptions) {
    const {
      activeSkill,
      selectedLevel,
      levelForm,
      metaForm,
      setSaving,
      setError,
      setSuccess,
      setActiveSkill,
    } = params
    if (!activeSkill || !selectedLevel) return null
    const manageSaving = options?.manageSaving ?? true
    const showSuccess = options?.showSuccess ?? true
    if (manageSaving) {
      setSaving(true)
      setError("")
      setSuccess("")
    }
    try {
      const updatedSkill = (await updateSkillLevelUseCase(skillsDashboardDeps, {
        skillId: activeSkill.id,
        levelId: selectedLevel.id,
        payload: mapUpdateSkillLevelPayload({
          meta: metaForm,
          level: levelForm,
          fallbackLevelRequired: selectedLevel.levelRequired,
        }),
      })) as SkillDetail

      setActiveSkill(updatedSkill)
      if (showSuccess) setSuccess(`Level ${selectedLevel.levelNumber} atualizado.`)
      return updatedSkill
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar level.")
      return null
    } finally {
      if (manageSaving) setSaving(false)
    }
  }

  function addCustomField() {
    const { newCustomFieldName, newCustomFieldValue, setError, setLevelForm, setNewCustomFieldName, setNewCustomFieldValue, setCustomFieldModalOpen } =
      params
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
    const {
      selectedRpgId,
      metaForm,
      levelForm,
      abilityCategoriesEnabled,
      enabledAbilityCategories,
      setSaving,
      setError,
      setSuccess,
      setCreateOpen,
      setEditStep,
      setSelectedSkillId,
      setSkills,
    } = params
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

      const createdSkill = (await createSkillUseCase(skillsDashboardDeps, {
        payload: mapCreateSkillPayload({
          rpgId: selectedRpgId,
          meta: metaForm,
          level: levelForm,
        }),
      })) as SkillDetail

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

  async function createSnapshotLevel() {
    const { activeSkill, setSaving, setError, setSuccess, setActiveSkill, setMetaForm, setSkills, setSelectedLevelId } =
      params
    if (!activeSkill) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const updatedSkill = (await createSkillLevelSnapshotUseCase(skillsDashboardDeps, {
        skillId: activeSkill.id,
      })) as SkillDetail
      setActiveSkill(updatedSkill)
      setMetaForm(mapSkillToMetaForm(updatedSkill))
      setSkills((prev) =>
        prev.map((item) =>
          item.id === updatedSkill.id
            ? {
                ...item,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      const newestLevel = updatedSkill.levels[updatedSkill.levels.length - 1]
      setSelectedLevelId(newestLevel?.id ?? "")
      setSuccess("Novo level criado com copia profunda do level anterior.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar novo level.")
    } finally {
      setSaving(false)
    }
  }

  async function saveAll() {
    const { activeSkill, selectedLevel, setSaving, setError, setSuccess } = params
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
    const { activeSkill, selectedLevel, setError, setSaving, setSuccess, setActiveSkill, setMetaForm, setSkills, setSelectedLevelId } =
      params
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
      const updatedSkill = (await deleteSkillLevelUseCase(skillsDashboardDeps, {
        skillId: activeSkill.id,
        levelId: selectedLevel.id,
      })) as SkillDetail

      setActiveSkill(updatedSkill)
      setMetaForm(mapSkillToMetaForm(updatedSkill))
      setSkills((prev) =>
        prev.map((item) =>
          item.id === updatedSkill.id
            ? {
                ...item,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )

      const fallbackLevel =
        updatedSkill.levels.find((item) => item.levelNumber === levelNumber) ??
        updatedSkill.levels[updatedSkill.levels.length - 1]
      setSelectedLevelId(fallbackLevel?.id ?? "")
      setSuccess(`Level ${levelNumber} removido.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover level.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteActiveSkill() {
    const { activeSkill, skills, setSaving, setError, setSuccess, setSkills, setSelectedSkillId, setEditOpen } =
      params
    if (!activeSkill) return

    const shouldDelete = window.confirm(
      `Deseja deletar a habilidade "${activeSkill.slug}"? Essa acao nao pode ser desfeita.`,
    )
    if (!shouldDelete) return

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await deleteSkillUseCase(skillsDashboardDeps, { skillId: activeSkill.id })

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
    addCustomField,
    createSkill,
    createSnapshotLevel,
    saveAll,
    deleteSelectedLevel,
    deleteActiveSkill,
  }
}
