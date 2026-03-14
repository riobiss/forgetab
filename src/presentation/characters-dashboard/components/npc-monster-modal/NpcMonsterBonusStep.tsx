"use client"

import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"
import styles from "../../CharactersDashboardPage.module.css"
import type { CharacterEditorBootstrapDto } from "@/application/charactersEditor/types"
import type { NumericInputValue } from "./types"

type Props = {
  bootstrap: CharacterEditorBootstrapDto | null
  attributeValues: Record<string, NumericInputValue>
  skillValues: Record<string, NumericInputValue>
  saving: boolean
  onAttributeChange: (key: string, value: string) => void
  onSkillChange: (key: string, value: string) => void
  onSave: () => void
}

export default function NpcMonsterBonusStep({
  bootstrap,
  attributeValues,
  skillValues,
  saving,
  onAttributeChange,
  onSkillChange,
  onSave,
}: Props) {
  return (
    <div className={styles.modalBody}>
      <div className={styles.modalSection}>
        <div className={styles.modalSectionHeader}>
          <h3>Atributos</h3>
        </div>
        <NumericTemplateGrid
          items={(bootstrap?.attributes ?? []).map((attribute) => ({
            key: attribute.key,
            label: attribute.label,
          }))}
          values={attributeValues}
          onChange={onAttributeChange}
          gridClassName={styles.modalGrid}
          fieldClassName={styles.modalField}
          keyPrefix="npc-monster-attribute"
          min={0}
        />
      </div>

      {(bootstrap?.skills ?? []).length > 0 ? (
        <div className={styles.modalSection}>
          <div className={styles.modalSectionHeader}>
            <h3>Pericias</h3>
          </div>
          <NumericTemplateGrid
            items={(bootstrap?.skills ?? []).map((skill) => ({
              key: skill.key,
              label: skill.label,
            }))}
            values={skillValues}
            onChange={onSkillChange}
            gridClassName={styles.modalGrid}
            fieldClassName={styles.modalField}
            keyPrefix="npc-monster-skill"
            min={0}
          />
        </div>
      ) : null}

      <div className={styles.modalFooter}>
        <button type="button" className={styles.modalPrimaryButton} onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar bonus"}
        </button>
      </div>
    </div>
  )
}
