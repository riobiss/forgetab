"use client"

import { useEffect, useState } from "react"
import type { CatalogOption, CharacterIdentityTemplate, IdentityTemplate } from "../components/shared/types"
import type { Visibility } from "./useEditRpgState"

type RpgPayload = {
  rpg: {
    id: string
    title: string
    description: string
    visibility: Visibility
    useClassRaceBonuses?: boolean
  }
}

type UseEditRpgDataParams = {
  rpgId: string
  coreStatusOptions: readonly CatalogOption[]
  title: string
  description: string
  visibility: Visibility
  useClassRaceBonuses: boolean
  selectedAttributeKeys: string[]
  selectedStatusKeys: string[]
  statusLabelByKey: Record<string, string>
  skillTemplates: Array<{ key: string; label: string }>
  characterIdentityTemplates: CharacterIdentityTemplate[]
  characterCharacteristicTemplates: CharacterIdentityTemplate[]
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setVisibility: (value: Visibility) => void
  setUseClassRaceBonuses: (value: boolean) => void
  setSelectedAttributeKeys: (value: string[]) => void
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
  visibility,
  useClassRaceBonuses,
  selectedAttributeKeys,
  selectedStatusKeys,
  statusLabelByKey,
  skillTemplates,
  characterIdentityTemplates,
  characterCharacteristicTemplates,
  setTitle,
  setDescription,
  setVisibility,
  setUseClassRaceBonuses,
  setSelectedAttributeKeys,
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
  const [error, setError] = useState("")
  const [canEdit, setCanEdit] = useState(false)
  const [identitySuccess, setIdentitySuccess] = useState("")

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

        const attrPayload = (await attrRes.json()) as { attributes?: Array<{ key: string }> }
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

        setTitle(rpgPayload.rpg.title)
        setDescription(rpgPayload.rpg.description)
        setVisibility(rpgPayload.rpg.visibility)
        setUseClassRaceBonuses(Boolean(rpgPayload.rpg.useClassRaceBonuses))
        setSelectedAttributeKeys((attrPayload.attributes ?? []).map((item) => item.key))

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
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
        setClassDrafts(
          (classPayload.classes ?? []).map((item, index) => ({
            key: item.key,
            label: item.label,
            position: item.position ?? index,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
        setCharacterIdentityTemplates(characterIdentityPayload.fields ?? [])
        setCharacterCharacteristicTemplates(characterCharacteristicsPayload.fields ?? [])
        setCanEdit(true)
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
    setVisibility,
    setUseClassRaceBonuses,
    setSelectedAttributeKeys,
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
      body: JSON.stringify({ title, description, visibility, useClassRaceBonuses }),
    })
    const payload = (await response.json()) as { message?: string }
    if (!response.ok) throw new Error(payload.message ?? "Nao foi possivel atualizar o RPG.")
  }

  async function saveAttributeTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/attributes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributes: selectedAttributeKeys }),
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
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Erro ao salvar alteracoes."
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return {
    loading,
    saving,
    error,
    canEdit,
    identitySuccess,
    saveAll,
  }
}
