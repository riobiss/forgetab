"use client"

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import styles from "./SkillOptionsSection.module.css"
import type { SkillTemplate } from "../shared/types"

type Props = {
  showList: boolean
  onToggleList: () => void
  newSkillLabel: string
  onNewSkillLabelChange: (value: string) => void
  onAddSkill: () => void
  skillTemplates: SkillTemplate[]
  onRemoveSkill: (key: string) => void
}

export default function SkillOptionsSection({
  showList,
  onToggleList,
  newSkillLabel,
  onNewSkillLabelChange,
  onAddSkill,
  skillTemplates,
  onRemoveSkill,
}: Props) {
  return (
    <div className={styles.section}>
      <h3>Pericias</h3>
      <div className={styles.headerActions}>
        <button type="button" onClick={onToggleList}>
          {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showList ? "Ocultar pericias" : "Mostrar pericias"}
        </button>
      </div>

      {showList ? (
        <>
          <div className={styles.actions}>
            <input
              type="text"
              value={newSkillLabel}
              onChange={(event) => onNewSkillLabelChange(event.target.value)}
              placeholder="Ex.: medicina"
            />
            <button
              type="button"
              className={styles.iconOnlyButton}
              aria-label="Adicionar pericia"
              title="Adicionar pericia"
              onClick={onAddSkill}
            >
              <Plus size={16} />
            </button>
          </div>

          {skillTemplates.map((item) => (
            <div key={item.key} className={styles.actions}>
              <span>{item.label}</span>
              <button
                type="button"
                className={styles.iconOnlyButton}
                aria-label={`Remover pericia ${item.label}`}
                title={`Remover pericia ${item.label}`}
                onClick={() => onRemoveSkill(item.key)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </>
      ) : null}
    </div>
  )
}
