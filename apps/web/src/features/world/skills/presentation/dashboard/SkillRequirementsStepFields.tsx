import type { Dispatch, SetStateAction } from "react"
import styles from "./SkillsDashboardClient.module.css"
import type { LevelForm, MetaForm, TemplateOption } from "./types"
import { toggleId } from "./utils"

type SkillRequirementsStepFieldsProps = {
  classes: TemplateOption[]
  races: TemplateOption[]
  metaForm: MetaForm
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  levelForm: LevelForm
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  costResourceName?: string
}

export function SkillRequirementsStepFields({
  classes,
  races,
  metaForm,
  setMetaForm,
  levelForm,
  setLevelForm,
  costResourceName = "Pontos",
}: SkillRequirementsStepFieldsProps) {
  return (
    <div className={styles.bindingGrid}>
      <div className={styles.bindBox}>
        <h3>Classes permitidas</h3>
        {classes.map((item) => (
          <label key={item.id} className={styles.check}>
            <input
              type="checkbox"
              checked={metaForm.classIds.includes(item.id)}
              onChange={() =>
                setMetaForm((prev) => ({
                  ...prev,
                  classIds: toggleId(prev.classIds, item.id),
                }))
              }
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      <div className={styles.bindBox}>
        <h3>Racas permitidas</h3>
        {races.map((item) => (
          <label key={item.id} className={styles.check}>
            <input
              type="checkbox"
              checked={metaForm.raceIds.includes(item.id)}
              onChange={() =>
                setMetaForm((prev) => ({
                  ...prev,
                  raceIds: toggleId(prev.raceIds, item.id),
                }))
              }
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      <label className={styles.field}>
        <span>Nivel minimo</span>
        <input
          type="number"
          onWheel={(event) => event.currentTarget.blur()}
          min={1}
          value={levelForm.levelRequired}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))}
        />
      </label>
      <label className={`${styles.field} ${styles.spanTwo}`}>
        <span>Pre-requisito</span>
        <textarea
          rows={2}
          value={levelForm.prerequisite}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, prerequisite: event.target.value }))}
        />
      </label>
      <label className={styles.field}>
        <span>Preco ({costResourceName})</span>
        <input
          type="number"
          onWheel={(event) => event.currentTarget.blur()}
          min={0}
          step={1}
          value={levelForm.costPoints}
          onChange={(event) => setLevelForm((prev) => ({ ...prev, costPoints: event.target.value }))}
        />
      </label>
    </div>
  )
}
