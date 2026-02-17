"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import styles from "./AttributeOptionsSection.module.css"
import type { CatalogOption } from "../shared/types"

type Props = {
  showList: boolean
  onToggleList: () => void
  options: readonly CatalogOption[]
  selectedKeys: string[]
  onToggleItem: (key: string) => void
}

export default function AttributeOptionsSection({
  showList,
  onToggleList,
  options,
  selectedKeys,
  onToggleItem,
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
        <div className={styles.grid}>
          {options.map((item) => (
            <label key={item.key} className={styles.option}>
              <input
                type="checkbox"
                checked={selectedKeys.includes(item.key)}
                onChange={() => onToggleItem(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
