"use client"

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import styles from "./AttributeOptionsSection.module.css"
import type { AttributeTemplate } from "../shared/types"

type Props = {
  showList: boolean
  onToggleList: () => void
  newAttributeLabel: string
  onNewAttributeLabelChange: (value: string) => void
  onAddAttribute: () => void
  attributeTemplates: AttributeTemplate[]
  onRemoveAttribute: (key: string) => void
}

export default function AttributeOptionsSection({
  showList,
  onToggleList,
  newAttributeLabel,
  onNewAttributeLabelChange,
  onAddAttribute,
  attributeTemplates,
  onRemoveAttribute,
}: Props) {
  return (
    <div className={styles.section}>
      <h3>Atributos</h3>
      <div className={styles.headerActions}>
        <button type="button" onClick={onToggleList}>
          {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showList ? "Ocultar atributos" : "Mostrar atributos"}
        </button>
      </div>
      {showList ? (
        <>
          <div className={styles.actions}>
            <input
              type="text"
              value={newAttributeLabel}
              onChange={(event) => onNewAttributeLabelChange(event.target.value)}
              placeholder="Ex.: Força"
            />
            <button
              type="button"
              className={styles.iconOnlyButton}
              title="Adicionar atributo"
              aria-label="Adicionar atributo"
              onClick={onAddAttribute}
            >
              <Plus size={16} />
            </button>
          </div>

          {attributeTemplates.length === 0 ? (
            <p className={styles.hint}>Nenhum atributo cadastrado.</p>
          ) : null}

          {attributeTemplates.map((item) => (
            <div key={item.key} className={styles.actions}>
              <span>{item.label}</span>
              <button
                type="button"
                className={styles.iconOnlyButton}
                title={`Remover atributo ${item.label}`}
                aria-label={`Remover atributo ${item.label}`}
                onClick={() => onRemoveAttribute(item.key)}
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
