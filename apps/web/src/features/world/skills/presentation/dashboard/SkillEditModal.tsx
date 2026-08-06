import { NativeSelectField } from "@/components/select/NativeSelectField"
import { Plus, X } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import type { SkillCategory } from "@/types/skillBuilder"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import { SkillCustomFieldModal } from "./SkillCustomFieldModal"
import { SkillDeleteButton } from "./SkillDeleteButton"
import { SkillFormSteps, SkillStepNavigation } from "./SkillFormSteps"
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
  onOpenCustomFieldModal: () => void
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
  customFieldModalOpen: boolean
  newCustomFieldName: string
  setNewCustomFieldName: Dispatch<SetStateAction<string>>
  newCustomFieldValue: string
  setNewCustomFieldValue: Dispatch<SetStateAction<string>>
  onAddCustomField: () => void
  onCloseCustomFieldModal: () => void
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
  onOpenCustomFieldModal,
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
  customFieldModalOpen,
  newCustomFieldName,
  setNewCustomFieldName,
  newCustomFieldValue,
  setNewCustomFieldValue,
  onAddCustomField,
  onCloseCustomFieldModal,
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
            <button
              type="button"
              className={styles.modalIconButton}
              onClick={onOpenCustomFieldModal}
              aria-label="Novo campo"
              title="Novo campo"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              className={styles.modalIconButton}
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
            >
              <X size={18} />
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

        <SkillFormSteps
          step={editStep}
          setStep={setEditStep}
          classes={classes}
          races={races}
          metaForm={metaForm}
          setMetaForm={setMetaForm}
          levelForm={levelForm}
          setLevelForm={setLevelForm}
          abilityCategoriesEnabled={abilityCategoriesEnabled}
          enabledAbilityCategories={enabledAbilityCategories}
          categoryOptions={editCategoryOptions}
          tagOptions={tagOptions}
          costResourceName={costResourceName}
          showLevelEditorHeader
        />

        <div className={styles.actions}>
          <SkillStepNavigation step={editStep} setStep={setEditStep} />
          <SkillDeleteButton onDelete={onDeleteSkill} disabled={saving} />
          <button type="button" className={styles.primaryButton} onClick={onSaveAll} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <SkillCustomFieldModal
          open={customFieldModalOpen}
          name={newCustomFieldName}
          setName={setNewCustomFieldName}
          value={newCustomFieldValue}
          setValue={setNewCustomFieldValue}
          onAdd={onAddCustomField}
          onClose={onCloseCustomFieldModal}
        />
      </section>
    </div>
  )
}
