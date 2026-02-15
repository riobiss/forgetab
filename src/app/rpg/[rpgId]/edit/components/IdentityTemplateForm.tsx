"use client"

import { useMemo, useState } from "react"
import styles from "../page.module.css"

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
    try {
      await onSave(draft)
    } finally {
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

      <div className={styles.bonusGrid}>
        {selectedAttributeKeys.map((key) => (
          <label className={styles.field} key={`${draft.key}-att-${key}`}>
            <span>{attributeLabelByKey.get(key) ?? key}</span>
            <input
              type="number"
              value={draft.attributeBonuses[key] ?? 0}
              onChange={(event) =>
                updateBonus("attributeBonuses", key, event.target.value)
              }
            />
          </label>
        ))}
      </div>

      <div className={styles.bonusGrid}>
        {skillTemplates.map((skill) => (
          <label className={styles.field} key={`${draft.key}-skill-${skill.key}`}>
            <span>{skill.label}</span>
            <input
              type="number"
              value={draft.skillBonuses[skill.key] ?? 0}
              onChange={(event) =>
                updateBonus("skillBonuses", skill.key, event.target.value)
              }
            />
          </label>
        ))}
      </div>

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
