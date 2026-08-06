import type { Dispatch, SetStateAction } from "react"
import { Plus, X } from "lucide-react"
import styles from "./SkillsDashboardClient.module.css"
import { SkillCustomFieldModal } from "./SkillCustomFieldModal"
import { SkillFormSteps, SkillStepNavigation } from "./SkillFormSteps"
import type { LevelForm, MetaForm, TemplateOption } from "./types"
import type { SkillCategory } from "@/types/skillBuilder"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"

type SkillCreateModalProps = {
  open: boolean
  saving: boolean
  createStep: number
  setCreateStep: Dispatch<SetStateAction<number>>
  onClose: () => void
  onCreate: () => void
  onOpenCustomFieldModal: () => void
  classes: TemplateOption[]
  races: TemplateOption[]
  metaForm: MetaForm
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  levelForm: LevelForm
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  createCategoryOptions: Array<{ key: string; label: string }>
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

export function SkillCreateModal({
  open,
  saving,
  createStep,
  setCreateStep,
  onClose,
  onCreate,
  onOpenCustomFieldModal,
  classes,
  races,
  metaForm,
  setMetaForm,
  levelForm,
  setLevelForm,
  abilityCategoriesEnabled,
  enabledAbilityCategories,
  createCategoryOptions,
  tagOptions,
  costResourceName,
  customFieldModalOpen,
  newCustomFieldName,
  setNewCustomFieldName,
  newCustomFieldValue,
  setNewCustomFieldValue,
  onAddCustomField,
  onCloseCustomFieldModal,
}: SkillCreateModalProps) {
  if (!open) return null

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Criar habilidade"
      onClick={onClose}
    >
      <section className={`${styles.card} ${styles.modalCard}`} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Criar</h2>
          <div className={styles.modalHeaderActions}>
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

        <SkillFormSteps
          step={createStep}
          setStep={setCreateStep}
          classes={classes}
          races={races}
          metaForm={metaForm}
          setMetaForm={setMetaForm}
          levelForm={levelForm}
          setLevelForm={setLevelForm}
          abilityCategoriesEnabled={abilityCategoriesEnabled}
          enabledAbilityCategories={enabledAbilityCategories}
          categoryOptions={createCategoryOptions}
          tagOptions={tagOptions}
          costResourceName={costResourceName}
        />

        <div className={styles.actions}>
          <SkillStepNavigation step={createStep} setStep={setCreateStep} />
          <button type="button" className={styles.primaryButton} onClick={onCreate} disabled={saving}>
            {saving ? "Criando..." : "Criar"}
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
