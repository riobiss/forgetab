"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { createDefaultRaceLore, normalizeRaceLore, type RaceLore } from "@/lib/rpg/raceLore"
import {
  loadRpgEditorBootstrapUseCase,
  saveRpgClassesUseCase,
  saveRpgRacesUseCase,
} from "@/application/rpgEditor/use-cases/rpgEditor"
import type { AttributeTemplate } from "@/presentation/rpg-editor/edit/components/shared/types"
import type { IdentityTemplateDraft } from "@/presentation/rpg-editor/edit/components/AdvancedIdentityEditor"
import { createRpgEditorDependencies } from "@/presentation/rpg-editor/dependencies"
import type { AdvancedIdentityType } from "./types"

type IdentityTemplate = {
  key: string
  label: string
  category?: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
  lore?: RaceLore
  catalogMeta?: unknown
}

type SkillTemplate = {
  key: string
  label: string
}

export function useAdvancedIdentityEditor(params: {
  rpgId: string
  type: AdvancedIdentityType | null
  templateKey: string
}) {
  const router = useRouter()
  const deps = useMemo(() => createRpgEditorDependencies("http"), [])
  const mode: "create" | "edit" = params.templateKey === "new" ? "create" : "edit"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [attributeTemplates, setAttributeTemplates] = useState<AttributeTemplate[]>([])
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>([])
  const [identityTemplates, setIdentityTemplates] = useState<IdentityTemplate[]>([])
  const [draft, setDraft] = useState<IdentityTemplateDraft | null>(null)

  useEffect(() => {
    async function loadAll() {
      if (!params.type) {
        setError("Tipo invalido para edicao.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        setSuccess("")

        const payload = await loadRpgEditorBootstrapUseCase(deps, { rpgId: params.rpgId })
        if (!payload.rpg?.canManage) {
          setError("Voce nao pode editar este RPG.")
          return
        }

        const attributes = payload.attributes ?? []
        const attributeKeys = attributes.map((item) => item.key)
        const skills = (payload.skills ?? []).map((item) => ({ key: item.key, label: item.label }))
        const templates = params.type === "race" ? payload.races ?? [] : payload.classes ?? []

        setAttributeTemplates(attributes)
        setSkillTemplates(skills)
        setIdentityTemplates(
          templates.map((item) => ({
            key: item.key,
            label: item.label,
            category: item.category,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
            lore: params.type === "race" ? normalizeRaceLore(item.lore, item.label) : undefined,
            catalogMeta: item.catalogMeta,
          })),
        )

        if (mode === "create") {
          setDraft({
            key: `draft-${crypto.randomUUID()}`,
            label: "",
            category: "geral",
            attributeBonuses: attributeKeys.reduce<Record<string, number>>((acc, key) => {
              acc[key] = 0
              return acc
            }, {}),
            skillBonuses: skills.reduce<Record<string, number>>((acc, item) => {
              acc[item.key] = 0
              return acc
            }, {}),
            ...(params.type === "race" ? { lore: createDefaultRaceLore() } : {}),
            catalogMeta: normalizeEntityCatalogMeta(undefined),
          })
          return
        }

        const current = templates.find((item) => item.key === params.templateKey)
        if (!current) {
          setError(`${params.type === "race" ? "Raca" : "Classe"} nao encontrada.`)
          return
        }

        setDraft({
          key: current.key,
          label: current.label,
          category: current.category?.trim() || "geral",
          attributeBonuses: attributeKeys.reduce<Record<string, number>>((acc, key) => {
            acc[key] = Number(current.attributeBonuses?.[key] ?? 0)
            return acc
          }, {}),
          skillBonuses: skills.reduce<Record<string, number>>((acc, item) => {
            acc[item.key] = Number(current.skillBonuses?.[item.key] ?? 0)
            return acc
          }, {}),
          ...(params.type === "race"
            ? { lore: normalizeRaceLore(current.lore, current.label) }
            : {}),
          catalogMeta: normalizeEntityCatalogMeta(current.catalogMeta),
        })
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro de conexao ao carregar editor avancado.")
      } finally {
        setLoading(false)
      }
    }

    void loadAll()
  }, [deps, mode, params.rpgId, params.templateKey, params.type])

  async function handleSave() {
    if (!params.type || !draft) return

    const label = draft.label.trim()
    if (label.length < 2) {
      setError(`Toda ${params.type === "race" ? "raca" : "classe"} precisa de nome com 2+ caracteres.`)
      return
    }

    const attributeKeys = attributeTemplates.map((item) => item.key)
    const parsedAttributes = attributeKeys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = Math.floor(Number(draft.attributeBonuses[key] ?? 0))
      return acc
    }, {})
    if (Object.values(parsedAttributes).some((value) => !Number.isFinite(value))) {
      setError("Valor invalido em bonus de atributos.")
      return
    }

    const parsedSkills = skillTemplates.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = Math.floor(Number(draft.skillBonuses[item.key] ?? 0))
      return acc
    }, {})
    if (Object.values(parsedSkills).some((value) => !Number.isFinite(value))) {
      setError("Valor invalido em bonus de pericias.")
      return
    }

    const payloadTemplate = {
      key: draft.key,
      label,
      category: draft.category?.trim() || "geral",
      attributeBonuses: parsedAttributes,
      skillBonuses: parsedSkills,
      ...(params.type === "race" ? { lore: normalizeRaceLore(draft.lore, label) } : {}),
      catalogMeta: draft.catalogMeta,
    }

    const nextTemplates =
      mode === "create"
        ? [...identityTemplates, payloadTemplate]
        : identityTemplates.map((item) => (item.key === draft.key ? { ...item, ...payloadTemplate } : item))

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (params.type === "race") {
        await saveRpgRacesUseCase(deps, {
          rpgId: params.rpgId,
          races: nextTemplates,
        })
      } else {
        await saveRpgClassesUseCase(deps, {
          rpgId: params.rpgId,
          classes: nextTemplates,
        })
      }

      setSuccess(`${params.type === "race" ? "Raca" : "Classe"} salva com sucesso.`)
      toast.success(`${params.type === "race" ? "Raca" : "Classe"} salva com sucesso.`)
      router.push(`/rpg/${params.rpgId}/edit`)
      router.refresh()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Nao foi possivel salvar."
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    router.push(`/rpg/${params.rpgId}/edit`)
  }

  return {
    mode,
    loading,
    saving,
    error,
    success,
    draft,
    setDraft,
    attributeTemplates,
    skillTemplates,
    handleSave,
    handleCancel,
  }
}
