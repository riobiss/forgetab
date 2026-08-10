import type { Dispatch, SetStateAction } from "react"
import type { SkillCategory } from "@forgetab/world-contracts/skill-builder"
import type { ReactSelectOption } from "@/components/select/types"
import { SkillBasicStepFields } from "./SkillBasicStepFields"
import { SkillRequirementsStepFields } from "./SkillRequirementsStepFields"
import styles from "./SkillsDashboardClient.module.css"
import type { LevelForm, MetaForm, TemplateOption } from "./types"

type Props = {
  step: number
  setStep: Dispatch<SetStateAction<number>>
  classes: TemplateOption[]
  races: TemplateOption[]
  metaForm: MetaForm
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  levelForm: LevelForm
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: SkillCategory[]
  categoryOptions: Array<{ key: string; label: string }>
  tagOptions: ReactSelectOption[]
  costResourceName: string
  showLevelEditorHeader?: boolean
}

export function SkillFormSteps({
  step,
  setStep,
  classes,
  races,
  metaForm,
  setMetaForm,
  levelForm,
  setLevelForm,
  abilityCategoriesEnabled,
  enabledAbilityCategories,
  categoryOptions,
  tagOptions,
  costResourceName,
  showLevelEditorHeader = false
}: Props) {
  return (
    <>
      <div className={styles.stepper}>
        {[1, 2].map((stepNumber) => (
          <button
            type="button"
            key={stepNumber}
            className={step === stepNumber ? styles.stepActive : styles.step}
            onClick={() => setStep(stepNumber)}
          >
            {stepNumber === 1 ? "Basico" : "Requerimentos"}
          </button>
        ))}
      </div>

      {step === 1 ? (
        <SkillBasicStepFields
          metaForm={metaForm}
          setMetaForm={setMetaForm}
          levelForm={levelForm}
          setLevelForm={setLevelForm}
          abilityCategoriesEnabled={abilityCategoriesEnabled}
          enabledAbilityCategories={enabledAbilityCategories}
          categoryOptions={categoryOptions}
          tagOptions={tagOptions}
        />
      ) : null}

      {showLevelEditorHeader && step >= 2 ? (
        <div className={styles.levelHeader}>
          <h3>Editor de Levels</h3>
          <div className={styles.levelHeaderActions} />
        </div>
      ) : null}

      {step === 2 ? (
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
    </>
  )
}

export function SkillStepNavigation({
  step,
  setStep
}: Pick<Props, "step" | "setStep">) {
  return (
    <>
      {step > 1 ? (
        <button
          type="button"
          className={styles.ghostButton}
          onClick={() => setStep((current) => current - 1)}
        >
          Voltar
        </button>
      ) : null}
      {step < 2 ? (
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setStep((current) => current + 1)}
        >
          Proxima
        </button>
      ) : null}
    </>
  )
}
