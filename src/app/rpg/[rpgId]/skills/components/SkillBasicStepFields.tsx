import type { Dispatch, SetStateAction } from "react"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import { ReactSelectField, type ReactSelectOption } from "@/components/select/ReactSelectField"
import {
  actionTypeValues,
  skillTagValues,
  skillTypeValues,
  type ActionType,
  type SkillCategory,
  type SkillTag,
  type SkillType,
} from "@/types/skillBuilder"
import { actionTypeLabel, skillTypeLabel } from "./constants"
import styles from "./SkillsDashboardClient.module.css"
import type { LevelForm, MetaForm } from "./types"

type SkillBasicStepFieldsProps = {
  metaForm: MetaForm
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  levelForm: LevelForm
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  categoryOptions: Array<{ key: string; label: string }>
  tagOptions: ReactSelectOption[]
}

export function SkillBasicStepFields({
  metaForm,
  setMetaForm,
  levelForm,
  setLevelForm,
  abilityCategoriesEnabled,
  enabledAbilityCategories,
  categoryOptions,
  tagOptions,
}: SkillBasicStepFieldsProps) {
  return (
    <div className={styles.grid}>
      <label className={styles.field}>
        <span>Nome</span>
        <input
          value={metaForm.name}
          onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </label>
      <label className={`${styles.field} ${styles.spanTwo}`}>
        <span>Descricao</span>
        <textarea
          rows={5}
          value={metaForm.description}
          onChange={(event) => setMetaForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </label>
      {abilityCategoriesEnabled ? (
        <label className={styles.field}>
          <span>Categoria</span>
          <NativeSelectField
            value={metaForm.category}
            onChange={(event) =>
              setMetaForm((prev) => ({
                ...prev,
                category: event.target.value as SkillCategory | "",
              }))
            }
          >
            <option value="">Selecione</option>
            {categoryOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </NativeSelectField>
        </label>
      ) : null}
      <label className={styles.field}>
        <span>Tipo</span>
        <NativeSelectField
          value={metaForm.type}
          onChange={(event) =>
            setMetaForm((prev) => ({
              ...prev,
              type: event.target.value as SkillType | "",
            }))
          }
        >
          <option value="">Selecione</option>
          {skillTypeValues.map((option) => (
            <option key={option} value={option}>
              {skillTypeLabel[option]}
            </option>
          ))}
        </NativeSelectField>
      </label>
      <label className={styles.field}>
        <span>Ação</span>
        <NativeSelectField
          value={metaForm.actionType}
          onChange={(event) =>
            setMetaForm((prev) => ({
              ...prev,
              actionType: event.target.value as ActionType | "",
            }))
          }
        >
          <option value="">Selecione</option>
          {actionTypeValues.map((option) => (
            <option key={option} value={option}>
              {actionTypeLabel[option]}
            </option>
          ))}
        </NativeSelectField>
      </label>
      <label className={`${styles.field} ${styles.spanTwo}`}>
        <span>Tags</span>
        <ReactSelectField
          classNames={{ container: () => styles.field }}
          options={tagOptions}
          value={tagOptions.find((option) => option.value === metaForm.tags[0]) ?? null}
          onChange={(option) =>
            setMetaForm((prev) => ({
              ...prev,
              tags: option && skillTagValues.includes(option.value as SkillTag) ? [option.value as SkillTag] : [],
            }))
          }
          placeholder="Selecione as tags..."
        />
        <small className={styles.muted}>Selecione uma tag.</small>
      </label>
      <label className={styles.field}>
        <span>Dano</span>
        <input
          value={levelForm.damage}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, damage: event.target.value }))}
        />
      </label>
      <label className={styles.field}>
        <span>Alcance</span>
        <input
          value={levelForm.range}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, range: event.target.value }))}
        />
      </label>
      <label className={styles.field}>
        <span>Duracao</span>
        <input
          value={levelForm.duration}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, duration: event.target.value }))}
        />
      </label>
      <label className={styles.field}>
        <span>Recarga</span>
        <input
          value={levelForm.cooldown}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, cooldown: event.target.value }))}
        />
      </label>
      <label className={styles.field}>
        <span>Tempo de conjuracao</span>
        <input
          value={levelForm.castTime}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, castTime: event.target.value }))}
        />
      </label>
      <label className={styles.field}>
        <span>Custo</span>
        <input
          value={levelForm.costCustom}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, costCustom: event.target.value }))}
        />
      </label>
      {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
        <p className={styles.error}>Ative pelo menos uma categoria</p>
      ) : null}
      {levelForm.customFields.map((field) => (
        <label key={field.id} className={`${styles.field} ${styles.spanTwo}`}>
          <span>{field.name}</span>
          <input
            value={field.value}
            onChange={(event) =>
              setLevelForm((prev) => ({
                ...prev,
                customFields: prev.customFields.map((item) =>
                  item.id === field.id ? { ...item, value: event.target.value } : item,
                ),
              }))
            }
          />
        </label>
      ))}
    </div>
  )
}
