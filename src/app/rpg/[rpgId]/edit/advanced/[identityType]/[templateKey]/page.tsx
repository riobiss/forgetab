"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ATTRIBUTE_CATALOG } from "@/lib/rpg/attributeCatalog"
import AdvancedIdentityEditor, {
  IdentityTemplateDraft,
} from "../../../components/AdvancedIdentityEditor"
import { createDefaultRaceLore, normalizeRaceLore, type RaceLore } from "@/lib/rpg/raceLore"
import styles from "./page.module.css"

type IdentityType = "race" | "class"

type IdentityTemplate = {
  key: string
  label: string
  category?: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
  lore?: RaceLore
}

type SkillTemplate = {
  key: string
  label: string
}

type RpgPayload = {
  rpg?: {
    id: string
    ownerId: string
    title: string
  }
  message?: string
}

export default function AdvancedIdentityPage() {
  const router = useRouter()
  const params = useParams<{
    rpgId: string
    identityType: string
    templateKey: string
  }>()

  const rpgId = params.rpgId
  const rawType = params.identityType
  const templateKey = params.templateKey
  const type: IdentityType | null = rawType === "race" || rawType === "class" ? rawType : null
  const mode = templateKey === "new" ? "create" : "edit"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedAttributeKeys, setSelectedAttributeKeys] = useState<string[]>([])
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>([])
  const [identityTemplates, setIdentityTemplates] = useState<IdentityTemplate[]>([])
  const [draft, setDraft] = useState<IdentityTemplateDraft | null>(null)

  const attributeLabelByKey = useMemo<Map<string, string>>(
    () => new Map(ATTRIBUTE_CATALOG.map((item) => [item.key, item.label])),
    [],
  )

  useEffect(() => {
    async function loadAll() {
      if (!type) {
        setError("Tipo invalido para edicao.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        setSuccess("")

        const endpoint = type === "race" ? "races" : "classes"
        const [rpgRes, attrRes, skillRes, identityRes] = await Promise.all([
          fetch(`/api/rpg/${rpgId}`),
          fetch(`/api/rpg/${rpgId}/attributes`),
          fetch(`/api/rpg/${rpgId}/skills`),
          fetch(`/api/rpg/${rpgId}/${endpoint}`),
        ])

        const rpgPayload = (await rpgRes.json()) as RpgPayload
        if (!rpgRes.ok || !rpgPayload.rpg) {
          setError(rpgPayload.message ?? "Voce nao pode editar este RPG.")
          return
        }

        const attrPayload = (await attrRes.json()) as { attributes?: Array<{ key: string }> }
        const skillPayload = (await skillRes.json()) as { skills?: SkillTemplate[] }
        const identityPayload = (await identityRes.json()) as {
          races?: IdentityTemplate[]
          classes?: IdentityTemplate[]
          message?: string
        }

        if (!identityRes.ok) {
          setError(identityPayload.message ?? "Nao foi possivel carregar os templates.")
          return
        }

        const attributes = (attrPayload.attributes ?? []).map((item) => item.key)
        const skills = skillPayload.skills ?? []
        const templates = type === "race" ? (identityPayload.races ?? []) : (identityPayload.classes ?? [])

        setSelectedAttributeKeys(attributes)
        setSkillTemplates(skills)
        setIdentityTemplates(templates)

        if (mode === "create") {
          setDraft({
            key: `draft-${crypto.randomUUID()}`,
            label: "",
            ...(type === "class" ? { category: "geral" } : {}),
            attributeBonuses: attributes.reduce<Record<string, number>>((acc, key) => {
              acc[key] = 0
              return acc
            }, {}),
            skillBonuses: skills.reduce<Record<string, number>>((acc, item) => {
              acc[item.key] = 0
              return acc
            }, {}),
            ...(type === "race" ? { lore: createDefaultRaceLore() } : {}),
          })
          return
        }

        const current = templates.find((item) => item.key === templateKey)
        if (!current) {
          setError(`${type === "race" ? "Raca" : "Classe"} nao encontrada.`)
          return
        }

        setDraft({
          key: current.key,
          label: current.label,
          ...(type === "class" ? { category: current.category?.trim() || "geral" } : {}),
          attributeBonuses: attributes.reduce<Record<string, number>>((acc, key) => {
            acc[key] = Number(current.attributeBonuses[key] ?? 0)
            return acc
          }, {}),
          skillBonuses: skills.reduce<Record<string, number>>((acc, item) => {
            acc[item.key] = Number(current.skillBonuses[item.key] ?? 0)
            return acc
          }, {}),
          ...(type === "race"
            ? { lore: normalizeRaceLore(current.lore, current.label) }
            : {}),
        })
      } catch {
        setError("Erro de conexao ao carregar editor avancado.")
      } finally {
        setLoading(false)
      }
    }

    void loadAll()
  }, [mode, rpgId, templateKey, type])

  async function handleSave() {
    if (!type || !draft) return

    const label = draft.label.trim()
    if (label.length < 2) {
      setError(`Toda ${type === "race" ? "raca" : "classe"} precisa de nome com 2+ caracteres.`)
      return
    }

    const parsedAttributes = selectedAttributeKeys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = Math.floor(Number(draft.attributeBonuses[key] ?? 0))
      return acc
    }, {})
    const hasInvalidAttribute = Object.values(parsedAttributes).some((value) => !Number.isFinite(value))
    if (hasInvalidAttribute) {
      setError("Valor invalido em bonus de atributos.")
      return
    }

    const parsedSkills = skillTemplates.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = Math.floor(Number(draft.skillBonuses[item.key] ?? 0))
      return acc
    }, {})
    const hasInvalidSkill = Object.values(parsedSkills).some((value) => !Number.isFinite(value))
    if (hasInvalidSkill) {
      setError("Valor invalido em bonus de pericias.")
      return
    }

    const payloadTemplate = {
      label,
      ...(type === "class" ? { category: draft.category?.trim() || "geral" } : {}),
      attributeBonuses: parsedAttributes,
      skillBonuses: parsedSkills,
      ...(type === "race" ? { lore: normalizeRaceLore(draft.lore, label) } : {}),
    }

    const nextTemplates =
      mode === "create"
        ? [...identityTemplates, { key: draft.key, ...payloadTemplate }]
        : identityTemplates.map((item) =>
            item.key === draft.key ? { ...item, ...payloadTemplate } : item,
          )

    const endpoint = type === "race" ? "races" : "classes"
    const payload =
      type === "race"
        ? {
            races: nextTemplates.map((item) => ({
              label: item.label,
              attributeBonuses: item.attributeBonuses,
              skillBonuses: item.skillBonuses,
              lore: item.lore,
            })),
          }
        : {
            classes: nextTemplates.map((item) => ({
              label: item.label,
              category: item.category?.trim() || "geral",
              attributeBonuses: item.attributeBonuses,
              skillBonuses: item.skillBonuses,
            })),
          }

    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const response = await fetch(`/api/rpg/${rpgId}/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        setError(result.message ?? "Nao foi possivel salvar.")
        return
      }
      setSuccess(`${type === "race" ? "Raca" : "Classe"} salva com sucesso.`)
      router.push("/rpg/" + rpgId + "/edit")
      router.refresh()
    } catch {
      setError("Erro de conexao ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    router.push(`/rpg/${rpgId}/edit`)
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>Carregando editor avancado...</p>
      </main>
    )
  }

  if (!type || !draft) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>{error || "Nao foi possivel abrir o editor."}</p>
        <button type="button" className={styles.backButton} onClick={handleCancel}>
          Voltar para editar RPG
        </button>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <AdvancedIdentityEditor
        type={type}
        mode={mode}
        draft={draft}
        selectedAttributeKeys={selectedAttributeKeys}
        skillTemplates={skillTemplates}
        attributeLabelByKey={attributeLabelByKey}
        saving={saving}
        error={error}
        success={success}
        onChange={setDraft}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </main>
  )
}
