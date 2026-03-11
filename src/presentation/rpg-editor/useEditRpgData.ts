"use client"

import { useEffect, useRef, useState } from "react"
import type { RpgEditorDependencies } from "@/application/rpgEditor/contracts/RpgEditorDependencies"
import {
  deleteRpgUseCase,
  loadRpgEditorBootstrapUseCase,
  saveRpgAttributesUseCase,
  saveRpgCharacterCharacteristicFieldsUseCase,
  saveRpgCharacterIdentityFieldsUseCase,
  saveRpgSkillsUseCase,
  saveRpgStatusesUseCase,
  updateRpgUseCase,
} from "@/application/rpgEditor/use-cases/rpgEditor"
import {
  normalizeEnabledAbilityCategories,
  type AbilityCategoryKey,
} from "@/lib/rpg/abilityCategories"
import {
  enforceXpLevelPattern,
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"
import type {
  AttributeTemplate,
  CatalogOption,
  CharacterIdentityTemplate,
  IdentityTemplate,
} from "@/presentation/rpg-editor/edit/components/shared/types"
import type { Visibility } from "@/presentation/rpg-editor/edit/hooks/useEditRpgState"

function isLegacyFiveLevelDefault(tiers: ProgressionTier[]) {
  if (tiers.length !== 5) return false
  const expected = [
    ["Level 1", 0],
    ["Level 2", 100],
    ["Level 3", 250],
    ["Level 4", 450],
    ["Level 5", 700],
  ] as const

  return expected.every(
    ([label, required], index) =>
      tiers[index]?.label === label && tiers[index]?.required === required,
  )
}

type UseEditRpgDataParams = {
  deps: RpgEditorDependencies
  rpgId: string
  coreStatusOptions: readonly CatalogOption[]
  title: string
  description: string
  image: string
  visibility: Visibility
  useMundiMap: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  usersCanManageOwnXp: boolean
  allowSkillPointDistribution: boolean
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: AbilityCategoryKey[]
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
  attributeTemplates: AttributeTemplate[]
  selectedStatusKeys: string[]
  statusLabelByKey: Record<string, string>
  skillTemplates: Array<{ key: string; label: string }>
  characterIdentityTemplates: CharacterIdentityTemplate[]
  characterCharacteristicTemplates: CharacterIdentityTemplate[]
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setImage: (value: string) => void
  setVisibility: (value: Visibility) => void
  setUseMundiMap: (value: boolean) => void
  setUseRaceBonuses: (value: boolean) => void
  setUseClassBonuses: (value: boolean) => void
  setUseInventoryWeightLimit: (value: boolean) => void
  setAllowMultiplePlayerCharacters: (value: boolean) => void
  setUsersCanManageOwnXp: (value: boolean) => void
  setAllowSkillPointDistribution: (value: boolean) => void
  setAbilityCategoriesEnabled: (value: boolean) => void
  setEnabledAbilityCategories: (value: AbilityCategoryKey[]) => void
  setProgressionMode: (value: ProgressionMode) => void
  setProgressionTiers: (value: ProgressionTier[]) => void
  setCostsEnabled: (value: boolean) => void
  setCostResourceName: (value: string) => void
  setAttributeTemplates: (value: AttributeTemplate[]) => void
  setSelectedStatusKeys: (value: string[]) => void
  setStatusLabelByKey: (value: Record<string, string>) => void
  setSkillTemplates: (value: Array<{ key: string; label: string }>) => void
  setRaceDrafts: (value: IdentityTemplate[]) => void
  setClassDrafts: (value: IdentityTemplate[]) => void
  setCharacterIdentityTemplates: (value: CharacterIdentityTemplate[]) => void
  setCharacterCharacteristicTemplates: (value: CharacterIdentityTemplate[]) => void
}

export function useEditRpgData({
  deps,
  rpgId,
  coreStatusOptions,
  title,
  description,
  image,
  visibility,
  useMundiMap,
  useRaceBonuses,
  useClassBonuses,
  useInventoryWeightLimit,
  allowMultiplePlayerCharacters,
  usersCanManageOwnXp,
  allowSkillPointDistribution,
  abilityCategoriesEnabled,
  enabledAbilityCategories,
  progressionMode,
  progressionTiers,
  attributeTemplates,
  selectedStatusKeys,
  statusLabelByKey,
  skillTemplates,
  characterIdentityTemplates,
  characterCharacteristicTemplates,
  setTitle,
  setDescription,
  setImage,
  setVisibility,
  setUseMundiMap,
  setUseRaceBonuses,
  setUseClassBonuses,
  setUseInventoryWeightLimit,
  setAllowMultiplePlayerCharacters,
  setUsersCanManageOwnXp,
  setAllowSkillPointDistribution,
  setAbilityCategoriesEnabled,
  setEnabledAbilityCategories,
  setProgressionMode,
  setProgressionTiers,
  setCostsEnabled,
  setCostResourceName,
  setAttributeTemplates,
  setSelectedStatusKeys,
  setStatusLabelByKey,
  setSkillTemplates,
  setRaceDrafts,
  setClassDrafts,
  setCharacterIdentityTemplates,
  setCharacterCharacteristicTemplates,
}: UseEditRpgDataParams) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [identitySuccess, setIdentitySuccess] = useState("")
  const savingRef = useRef(false)
  const deletingRef = useRef(false)

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true)
        setError("")

        const payload = await loadRpgEditorBootstrapUseCase(deps, { rpgId })
        const rpg = payload.rpg

        if (!rpg) {
          setError("Voce nao pode editar este RPG.")
          setCanEdit(false)
          return
        }

        if (!rpg.canManage) {
          setError("Voce nao pode editar este RPG.")
          setCanEdit(false)
          setCanDelete(false)
          return
        }

        setTitle(rpg.title)
        setDescription(rpg.description)
        setImage(rpg.image?.trim() || "")
        setVisibility(rpg.visibility)
        setUseMundiMap(Boolean(rpg.useMundiMap))

        const legacyClassRaceFlag = Boolean(rpg.useClassRaceBonuses)
        setUseRaceBonuses(
          typeof rpg.useRaceBonuses === "boolean" ? rpg.useRaceBonuses : legacyClassRaceFlag,
        )
        setUseClassBonuses(
          typeof rpg.useClassBonuses === "boolean" ? rpg.useClassBonuses : legacyClassRaceFlag,
        )
        setUseInventoryWeightLimit(Boolean(rpg.useInventoryWeightLimit))
        setAllowMultiplePlayerCharacters(Boolean(rpg.allowMultiplePlayerCharacters))
        setUsersCanManageOwnXp(Boolean(rpg.usersCanManageOwnXp ?? true))
        setAllowSkillPointDistribution(Boolean(rpg.allowSkillPointDistribution ?? true))
        setAbilityCategoriesEnabled(Boolean(rpg.abilityCategoriesEnabled ?? false))
        setEnabledAbilityCategories(normalizeEnabledAbilityCategories(rpg.enabledAbilityCategories))

        const loadedProgressionMode = isProgressionMode(rpg.progressionMode)
          ? rpg.progressionMode
          : ("xp_level" as ProgressionMode)
        setProgressionMode(loadedProgressionMode)

        const loadedTiers = normalizeProgressionTiers(rpg.progressionTiers, loadedProgressionMode)
        setProgressionTiers(
          loadedProgressionMode === "xp_level" && isLegacyFiveLevelDefault(loadedTiers)
            ? loadedTiers.slice(0, 2)
            : loadedTiers,
        )

        setCostsEnabled(Boolean(rpg.costsEnabled))
        setCostResourceName(rpg.costResourceName?.trim() || "Skill Points")
        setAttributeTemplates(payload.attributes ?? [])

        const loadedStatuses = payload.statuses ?? []
        setSelectedStatusKeys(loadedStatuses.map((item) => item.key))
        setStatusLabelByKey(
          loadedStatuses.reduce<Record<string, string>>((acc, item) => {
            acc[item.key] = item.label
            return acc
          }, {}),
        )

        setSkillTemplates((payload.skills ?? []).map((item) => ({ key: item.key, label: item.label })))
        setRaceDrafts(
          (payload.races ?? []).map((item, index) => ({
            key: item.key,
            label: item.label,
            position: item.position ?? index,
            category: item.category,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
            lore: item.lore,
          })),
        )
        setClassDrafts(
          (payload.classes ?? []).map((item, index) => ({
            key: item.key,
            label: item.label,
            position: item.position ?? index,
            category: item.category,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
        setCharacterIdentityTemplates(payload.identityFields ?? [])
        setCharacterCharacteristicTemplates(payload.characteristicFields ?? [])
        setCanEdit(true)
        setCanDelete(Boolean(rpg.canDelete))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro de conexao ao carregar RPG.")
        setCanEdit(false)
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) void loadAll()
  }, [
    deps,
    rpgId,
    setAbilityCategoriesEnabled,
    setAllowMultiplePlayerCharacters,
    setAllowSkillPointDistribution,
    setAttributeTemplates,
    setCharacterCharacteristicTemplates,
    setCharacterIdentityTemplates,
    setClassDrafts,
    setCostResourceName,
    setCostsEnabled,
    setDescription,
    setEnabledAbilityCategories,
    setImage,
    setProgressionMode,
    setProgressionTiers,
    setRaceDrafts,
    setSelectedStatusKeys,
    setSkillTemplates,
    setStatusLabelByKey,
    setTitle,
    setUseClassBonuses,
    setUseInventoryWeightLimit,
    setUseMundiMap,
    setUseRaceBonuses,
    setUsersCanManageOwnXp,
    setVisibility,
  ])

  async function saveAll() {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError("")
    setIdentitySuccess("")

    try {
      await Promise.all([
        updateRpgUseCase(deps, {
          rpgId,
          payload: {
            title,
            description,
            image: image.trim() || null,
            visibility,
            useMundiMap,
            useRaceBonuses,
            useClassBonuses,
            useInventoryWeightLimit,
            allowMultiplePlayerCharacters,
            usersCanManageOwnXp,
            allowSkillPointDistribution,
            abilityCategoriesEnabled,
            enabledAbilityCategories,
            progressionMode,
            progressionTiers:
              progressionTiers.length > 0
                ? progressionMode === "xp_level"
                  ? enforceXpLevelPattern(
                      progressionTiers.map((item) => ({
                        label: item.label.trim() || "Level",
                        required: Math.max(0, Math.floor(item.required)),
                      })),
                    )
                  : progressionTiers.map((item) => ({
                      label: item.label.trim() || "Etapa",
                      required: Math.max(0, Math.floor(item.required)),
                    }))
                : getDefaultProgressionTiers(progressionMode),
          },
        }),
        saveRpgAttributesUseCase(deps, {
          rpgId,
          attributes: attributeTemplates.map((item) => ({ key: item.key, label: item.label })),
        }),
        saveRpgStatusesUseCase(deps, {
          rpgId,
          statuses: selectedStatusKeys.map((key) => ({
            key,
            label: statusLabelByKey[key] ?? coreStatusOptions.find((option) => option.key === key)?.label ?? key,
          })),
        }),
        saveRpgSkillsUseCase(deps, {
          rpgId,
          skills: skillTemplates.map((item) => item.label),
        }),
        saveRpgCharacterIdentityFieldsUseCase(deps, {
          rpgId,
          fields: characterIdentityTemplates.map((item) => ({
            key: item.key,
            label: item.label,
            required: item.required,
            position: item.position,
          })),
        }),
        saveRpgCharacterCharacteristicFieldsUseCase(deps, {
          rpgId,
          fields: characterCharacteristicTemplates.map((item) => ({
            key: item.key,
            label: item.label,
            required: item.required,
            position: item.position,
          })),
        }),
      ])
      setIdentitySuccess("Tudo salvo com sucesso.")
      return true
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao salvar alteracoes."
      setError(message)
      return false
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  async function deleteRpg() {
    if (deletingRef.current) return { ok: false as const }
    deletingRef.current = true
    setDeleting(true)
    setError("")
    setIdentitySuccess("")

    try {
      await deleteRpgUseCase(deps, { rpgId })
      return { ok: true as const }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao deletar RPG."
      setError(message)
      return { ok: false as const }
    } finally {
      setDeleting(false)
      deletingRef.current = false
    }
  }

  return {
    loading,
    saving,
    deleting,
    error,
    canEdit,
    canDelete,
    identitySuccess,
    saveAll,
    deleteRpg,
  }
}
