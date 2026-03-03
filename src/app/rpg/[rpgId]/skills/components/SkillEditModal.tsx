import { NativeSelectField } from "@/components/select/NativeSelectField"
import type { Dispatch, SetStateAction } from "react"
import type { SkillCategory } from "@/types/skillBuilder"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import { SkillBasicStepFields } from "./SkillBasicStepFields"
import { SkillDeleteButton } from "./SkillDeleteButton"
import { SkillRequirementsStepFields } from "./SkillRequirementsStepFields"
import styles from "./SkillsDashboardClient.module.css"
import type { LevelForm, MetaForm, SkillDetail, TemplateOption } from "./types"

type SkillEditModalProps = {
  open: boolean
  saving: boolean
  activeSkill: SkillDetail
  selectedLevelId: string
  setSelectedLevelId: Dispatch<SetStateAction<string>>
  editStep: number
  setEditStep: Dispatch<SetStateAction<number>>
  onClose: () => void
  onCreateSnapshotLevel: () => void
  onDeleteSkill: () => void
  onDeleteLevel: () => void
  onSaveAll: () => void
  classes: TemplateOption[]
  races: TemplateOption[]
  metaForm: MetaForm
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  levelForm: LevelForm
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  editCategoryOptions: Array<{ key: string; label: string }>
  tagOptions: ReactSelectOption[]
  costResourceName: string
}

export function SkillEditModal({
  open,
  saving,
  activeSkill,
  selectedLevelId,
  setSelectedLevelId,
  editStep,
  setEditStep,
  onClose,
  onCreateSnapshotLevel,
  onDeleteSkill,
  onDeleteLevel,
  onSaveAll,
  classes,
  races,
  metaForm,
  setMetaForm,
  levelForm,
  setLevelForm,
  abilityCategoriesEnabled,
  enabledAbilityCategories,
  editCategoryOptions,
  tagOptions,
  costResourceName,
}: SkillEditModalProps) {
  if (!open) return null

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Editar habilidade"
      onClick={onClose}
    >
      <section className={`${styles.card} ${styles.modalCard}`} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Editar</h2>
          <div className={styles.modalHeaderActions}>
            <button type="button" className={styles.ghostButton} onClick={onCreateSnapshotLevel} disabled={saving}>
              Level +1
            </button>
            <SkillDeleteButton onDelete={onDeleteSkill} disabled={saving} />
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
        <div className={styles.levelHeader}>
          <div className={styles.levelHeaderActions}>
            {activeSkill.levels.length > 1 ? (
              <NativeSelectField value={selectedLevelId} onChange={(event) => setSelectedLevelId(event.target.value)}>
                {activeSkill.levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    Level {level.levelNumber}
                  </option>
                ))}
              </NativeSelectField>
            ) : null}
            <button
              type="button"
              className={styles.ghostButton}
              onClick={onDeleteLevel}
              disabled={saving || activeSkill.levels.length <= 1}
            >
              Deletar level
            </button>
          </div>
        </div>

        <div className={styles.stepper}>
          {[1, 2].map((step) => (
            <button
              type="button"
              key={step}
              className={editStep === step ? styles.stepActive : styles.step}
              onClick={() => setEditStep(step)}
            >
              {step === 1 ? "Basico" : "Requerimentos"}
            </button>
          ))}
        </div>

        {editStep === 1 ? (
          <SkillBasicStepFields
            metaForm={metaForm}
            setMetaForm={setMetaForm}
            levelForm={levelForm}
            setLevelForm={setLevelForm}
            abilityCategoriesEnabled={abilityCategoriesEnabled}
            enabledAbilityCategories={enabledAbilityCategories}
            categoryOptions={editCategoryOptions}
            tagOptions={tagOptions}
          />
        ) : null}

        {editStep >= 2 ? (
          <div className={styles.levelHeader}>
            <h3>Editor de Levels</h3>
            <div className={styles.levelHeaderActions} />
          </div>
        ) : null}

        {editStep === 2 ? (
          <SkillRequirementsStepFields
            classes={classes}
            races={races}
            metaForm={metaForm}
            setMetaForm={setMetaForm}
            levelForm={levelForm}
            setLevelForm={setLevelForm}
            costResourceName={costResourceName}
          />
        ) : null}

        <div className={styles.actions}>
          {editStep > 1 ? (
            <button type="button" className={styles.ghostButton} onClick={() => setEditStep((prev) => prev - 1)}>
              Voltar
            </button>
          ) : null}
          {editStep < 2 ? (
            <button type="button" className={styles.primaryButton} onClick={() => setEditStep((prev) => prev + 1)}>
              Proxima
            </button>
          ) : null}
          <button type="button" className={styles.primaryButton} onClick={onSaveAll} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </section>
    </div>
  )
}
