"use client"

import { useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import styles from "../page.module.css"
import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"
import { dismissToast } from "@/lib/toast"

type IdentityTemplateDraft = {
  key: string
  label: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
}

type SkillTemplate = {
  key: string
  label: string
}

type Props = {
  mode: "create" | "edit"
  type: "race" | "class"
  initialDraft: IdentityTemplateDraft
  selectedAttributeKeys: string[]
  skillTemplates: SkillTemplate[]
  attributeLabelByKey: Map<string, string>
  onCancel: () => void
  onSave: (draft: IdentityTemplateDraft) => Promise<void>
}

export default function IdentityTemplateForm({
  mode,
  type,
  initialDraft,
  selectedAttributeKeys,
  skillTemplates,
  attributeLabelByKey,
  onCancel,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<IdentityTemplateDraft>(initialDraft)
  const [saving, setSaving] = useState(false)

  const title = useMemo(() => {
    const typeLabel = type === "race" ? "Raça" : "Classe"
    return mode === "create" ? `Criar ${typeLabel}` : `Editar ${typeLabel}`
  }, [mode, type])

  function updateLabel(value: string) {
    setDraft((prev) => ({ ...prev, label: value }))
  }

  function updateBonus(
    scope: "attributeBonuses" | "skillBonuses",
    key: string,
    value: string,
  ) {
    setDraft((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [key]: Number(value),
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const loadingToastId = toast.loading("Salvando template...")
    try {
      await onSave(draft)
      toast.success(`${type === "race" ? "Raca" : "Classe"} salva com sucesso.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar template.")
    } finally {
      dismissToast(loadingToastId)
      setSaving(false)
    }
  }

  return (
    <section className={styles.identityEditorPanel}>
      <h4>{title}</h4>

      <label className={styles.field}>
        <span>Nome</span>
        <input
          type="text"
          value={draft.label}
          onChange={(event) => updateLabel(event.target.value)}
          placeholder={type === "race" ? "Nome da raça" : "Nome da classe"}
        />
      </label>

      <NumericTemplateGrid
        items={selectedAttributeKeys.map((key) => ({
          key,
          label: attributeLabelByKey.get(key) ?? key,
        }))}
        values={draft.attributeBonuses}
        onChange={(key, value) => updateBonus("attributeBonuses", key, value)}
        gridClassName={styles.bonusGrid}
        fieldClassName={styles.field}
        keyPrefix={`${draft.key}-att`}
      />

      <NumericTemplateGrid
        items={skillTemplates.map((skill) => ({
          key: skill.key,
          label: skill.label,
        }))}
        values={draft.skillBonuses}
        onChange={(key, value) => updateBonus("skillBonuses", key, value)}
        gridClassName={styles.bonusGrid}
        fieldClassName={styles.field}
        keyPrefix={`${draft.key}-skill`}
      />

      <div className={styles.actions}>
        <button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </section>
  )
}
