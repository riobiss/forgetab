"use client"

import { useEffect, useRef, useState } from "react"
import type {
  AttributeTemplate,
  CatalogOption,
  CharacterIdentityTemplate,
  IdentityTemplate,
} from "../components/shared/types"
import type { Visibility } from "./useEditRpgState"
import {
  enforceXpLevelPattern,
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"

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

type RpgPayload = {
  rpg: {
    id: string
    title: string
    description: string
    image?: string | null
    visibility: Visibility
    costsEnabled?: boolean
    costResourceName?: string
    useMundiMap?: boolean
    useRaceBonuses?: boolean
    useClassBonuses?: boolean
    useClassRaceBonuses?: boolean
    useInventoryWeightLimit?: boolean
    progressionMode?: ProgressionMode
    progressionTiers?: ProgressionTier[]
    canManage?: boolean
    canDelete?: boolean
  }
}

type UseEditRpgDataParams = {
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

        const [
          rpgRes,
          attrRes,
          statusRes,
          skillRes,
          raceRes,
          classRes,
          characterIdentityRes,
          characterCharacteristicsRes,
        ] = await Promise.all([
          fetch(`/api/rpg/${rpgId}`),
          fetch(`/api/rpg/${rpgId}/attributes`),
          fetch(`/api/rpg/${rpgId}/statuses`),
          fetch(`/api/rpg/${rpgId}/skills`),
          fetch(`/api/rpg/${rpgId}/races`),
          fetch(`/api/rpg/${rpgId}/classes`),
          fetch(`/api/rpg/${rpgId}/character-identity`),
          fetch(`/api/rpg/${rpgId}/character-characteristics`),
        ])

        const rpgPayload = (await rpgRes.json()) as RpgPayload & { message?: string }
        if (!rpgRes.ok) {
          setError(rpgPayload.message ?? "Voce nao pode editar este RPG.")
          setCanEdit(false)
          return
        }

        const attrPayload = (await attrRes.json()) as { attributes?: Array<{ key: string; label: string }> }
        const statusPayload = (await statusRes.json()) as {
          statuses?: Array<{ key: string; label: string }>
        }
        const skillPayload = (await skillRes.json()) as {
          skills?: Array<{ key: string; label: string }>
        }
        const racePayload = (await raceRes.json()) as { races?: IdentityTemplate[] }
        const classPayload = (await classRes.json()) as { classes?: IdentityTemplate[] }
        const characterIdentityPayload = (await characterIdentityRes.json()) as {
          message?: string
          fields?: CharacterIdentityTemplate[]
        }
        const characterCharacteristicsPayload = (await characterCharacteristicsRes.json()) as {
          message?: string
          fields?: CharacterIdentityTemplate[]
        }

        if (!characterIdentityRes.ok) {
          setError(characterIdentityPayload.message ?? "Nao foi possivel carregar identidade.")
          setCanEdit(false)
          return
        }
        if (!characterCharacteristicsRes.ok) {
          setError(
            characterCharacteristicsPayload.message ?? "Nao foi possivel carregar caracteristicas.",
          )
          setCanEdit(false)
          return
        }

        if (!rpgPayload.rpg.canManage) {
          setError("Voce nao pode editar este RPG.")
          setCanEdit(false)
          setCanDelete(false)
          return
        }

        setTitle(rpgPayload.rpg.title)
        setDescription(rpgPayload.rpg.description)
        setImage(rpgPayload.rpg.image?.trim() || "")
        setVisibility(rpgPayload.rpg.visibility)
        setUseMundiMap(Boolean(rpgPayload.rpg.useMundiMap))
        const legacyClassRaceFlag = Boolean(rpgPayload.rpg.useClassRaceBonuses)
        setUseRaceBonuses(
          typeof rpgPayload.rpg.useRaceBonuses === "boolean"
            ? rpgPayload.rpg.useRaceBonuses
            : legacyClassRaceFlag,
        )
        setUseClassBonuses(
          typeof rpgPayload.rpg.useClassBonuses === "boolean"
            ? rpgPayload.rpg.useClassBonuses
            : legacyClassRaceFlag,
        )
        setUseInventoryWeightLimit(Boolean(rpgPayload.rpg.useInventoryWeightLimit))
        const loadedProgressionMode = isProgressionMode(rpgPayload.rpg.progressionMode)
          ? rpgPayload.rpg.progressionMode
          : ("xp_level" as ProgressionMode)
        setProgressionMode(loadedProgressionMode)
        const loadedTiers = normalizeProgressionTiers(
          rpgPayload.rpg.progressionTiers,
          loadedProgressionMode,
        )
        setProgressionTiers(
          loadedProgressionMode === "xp_level" && isLegacyFiveLevelDefault(loadedTiers)
            ? loadedTiers.slice(0, 2)
            : loadedTiers,
        )
        setCostsEnabled(Boolean(rpgPayload.rpg.costsEnabled))
        setCostResourceName(rpgPayload.rpg.costResourceName?.trim() || "Skill Points")
        setAttributeTemplates(attrPayload.attributes ?? [])

        const loadedStatuses = statusPayload.statuses ?? []
        setSelectedStatusKeys(loadedStatuses.map((item) => item.key))
        setStatusLabelByKey(
          loadedStatuses.reduce<Record<string, string>>((acc, item) => {
            acc[item.key] = item.label
            return acc
          }, {}),
        )

        setSkillTemplates(
          (skillPayload.skills ?? []).map((item) => ({ key: item.key, label: item.label })),
        )
        setRaceDrafts(
          (racePayload.races ?? []).map((item, index) => ({
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
          (classPayload.classes ?? []).map((item, index) => ({
            key: item.key,
            label: item.label,
            position: item.position ?? index,
            category: item.category,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
        setCharacterIdentityTemplates(characterIdentityPayload.fields ?? [])
        setCharacterCharacteristicTemplates(characterCharacteristicsPayload.fields ?? [])
        setCanEdit(true)
        setCanDelete(Boolean(rpgPayload.rpg.canDelete))
      } catch {
        setError("Erro de conexao ao carregar RPG.")
        setCanEdit(false)
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) void loadAll()
  }, [
    rpgId,
    setTitle,
    setDescription,
    setImage,
    setVisibility,
    setUseMundiMap,
    setUseRaceBonuses,
    setUseClassBonuses,
    setUseInventoryWeightLimit,
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
  ])

  async function saveRpgSettings() {
    const response = await fetch(`/api/rpg/${rpgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        image: image.trim() || null,
        visibility,
        useMundiMap,
        useRaceBonuses,
        useClassBonuses,
        useInventoryWeightLimit,
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
      }),
    })
    const payload = (await response.json()) as { message?: string }
    if (!response.ok) throw new Error(payload.message ?? "Nao foi possivel atualizar o RPG.")
  }

  async function saveAttributeTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/attributes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: attributeTemplates.map((item) => ({
          key: item.key,
          label: item.label,
        })),
      }),
    })
    if (!response.ok) throw new Error("Falha ao salvar atributos.")
  }

  async function saveStatusTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/statuses`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statuses: selectedStatusKeys.map((key) => ({
          key,
          label:
            statusLabelByKey[key] ??
            coreStatusOptions.find((option) => option.key === key)?.label ??
            key,
        })),
      }),
    })
    if (!response.ok) throw new Error("Falha ao salvar status.")
  }

  async function saveSkillTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: skillTemplates.map((item) => item.label),
      }),
    })
    if (!response.ok) throw new Error("Falha ao salvar pericias.")
  }

  async function saveCharacterIdentityTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/character-identity`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: characterIdentityTemplates.map((item) => ({
          label: item.label,
          required: item.required,
        })),
      }),
    })
    if (!response.ok) throw new Error("Falha ao salvar campos de identidade.")
  }

  async function saveCharacterCharacteristicsTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/character-characteristics`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: characterCharacteristicTemplates.map((item) => ({
          label: item.label,
          required: item.required,
        })),
      }),
    })
    if (!response.ok) throw new Error("Falha ao salvar campos de caracteristicas.")
  }

  async function saveAll() {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError("")
    setIdentitySuccess("")

    try {
      await Promise.all([
        saveRpgSettings(),
        saveAttributeTemplate(),
        saveStatusTemplate(),
        saveSkillTemplate(),
        saveCharacterIdentityTemplate(),
        saveCharacterCharacteristicsTemplate(),
      ])
      setIdentitySuccess("Tudo salvo com sucesso.")
      return true
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Erro ao salvar alteracoes."
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
      const response = await fetch(`/api/rpg/${rpgId}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(payload.message ?? "Nao foi possivel deletar o RPG.")
      }
      return { ok: true as const }
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Erro ao deletar RPG."
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
