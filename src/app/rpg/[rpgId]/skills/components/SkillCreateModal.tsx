import type { Dispatch, SetStateAction } from "react"
import styles from "./SkillsDashboardClient.module.css"
import { SkillBasicStepFields } from "./SkillBasicStepFields"
import { SkillRequirementsStepFields } from "./SkillRequirementsStepFields"
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
            <button type="button" className={styles.ghostButton} onClick={onOpenCustomFieldModal}>
              novo campo
            </button>
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>

        <div className={styles.stepper}>
          {[1, 2].map((step) => (
            <button
              type="button"
              key={step}
              className={createStep === step ? styles.stepActive : styles.step}
              onClick={() => setCreateStep(step)}
            >
              {step === 1 ? "Basico" : "Requerimentos"}
            </button>
          ))}
        </div>

        {createStep === 1 ? (
          <SkillBasicStepFields
            metaForm={metaForm}
            setMetaForm={setMetaForm}
            levelForm={levelForm}
            setLevelForm={setLevelForm}
            abilityCategoriesEnabled={abilityCategoriesEnabled}
            enabledAbilityCategories={enabledAbilityCategories}
            categoryOptions={createCategoryOptions}
            tagOptions={tagOptions}
          />
        ) : null}

        {createStep === 2 ? (
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
          {createStep > 1 ? (
            <button type="button" className={styles.ghostButton} onClick={() => setCreateStep((prev) => prev - 1)}>
              Voltar
            </button>
          ) : null}
          {createStep < 2 ? (
            <button type="button" className={styles.primaryButton} onClick={() => setCreateStep((prev) => prev + 1)}>
              Proxima
            </button>
          ) : null}
          <button type="button" className={styles.primaryButton} onClick={onCreate} disabled={saving}>
            {saving ? "Criando..." : "Criar"}
          </button>
        </div>

        {customFieldModalOpen ? (
          <div
            className={styles.nestedModalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Novo campo"
            onClick={onCloseCustomFieldModal}
          >
            <section className={`${styles.card} ${styles.nestedModalCard}`} onClick={(event) => event.stopPropagation()}>
              <h3>Novo campo</h3>
              <label className={styles.field}>
                <span>Nome</span>
                <input value={newCustomFieldName} onChange={(event) => setNewCustomFieldName(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Valor</span>
                <input value={newCustomFieldValue} onChange={(event) => setNewCustomFieldValue(event.target.value)} />
              </label>
              <div className={styles.actions}>
                <button type="button" className={styles.ghostButton} onClick={onCloseCustomFieldModal}>
                  Cancelar
                </button>
                <button type="button" className={styles.primaryButton} onClick={onAddCustomField}>
                  Criar campo
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}
