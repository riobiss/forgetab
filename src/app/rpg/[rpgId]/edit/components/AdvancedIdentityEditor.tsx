"use client"

import styles from "./AdvancedIdentityEditor.module.css"

type IdentityType = "race" | "class"

export type IdentityTemplateDraft = {
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
  type: IdentityType
  mode: "create" | "edit"
  draft: IdentityTemplateDraft
  selectedAttributeKeys: string[]
  skillTemplates: SkillTemplate[]
  attributeLabelByKey: Map<string, string>
  saving: boolean
  error: string
  success: string
  onChange: (next: IdentityTemplateDraft) => void
  onSave: () => Promise<void>
  onCancel: () => void
}

export default function AdvancedIdentityEditor({
  type,
  mode,
  draft,
  selectedAttributeKeys,
  skillTemplates,
  attributeLabelByKey,
  saving,
  error,
  success,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const typeLabel = type === "race" ? "Raca" : "Classe"
  const title = mode === "create" ? `Criar ${typeLabel}` : `Editar ${typeLabel}`

  function updateLabel(value: string) {
    onChange({ ...draft, label: value })
  }

  function updateBonus(
    scope: "attributeBonuses" | "skillBonuses",
    key: string,
    value: string,
  ) {
    onChange({
      ...draft,
      [scope]: {
        ...draft[scope],
        [key]: Number(value),
      },
    })
  }

  return (
    <section className={styles.panel}>
      <h1>{title}</h1>

      <label className={styles.field}>
        <span>Nome</span>
        <input
          type="text"
          value={draft.label}
          onChange={(event) => updateLabel(event.target.value)}
          placeholder={type === "race" ? "Nome da raca" : "Nome da classe"}
        />
      </label>

      <section className={styles.section}>
        <h2>Bonus de atributos</h2>
        <div className={styles.grid}>
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
      </section>

      <section className={styles.section}>
        <h2>Bonus de pericias</h2>
        <div className={styles.grid}>
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
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.actions}>
        <button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Voltar
        </button>
      </div>
    </section>
  )
}
