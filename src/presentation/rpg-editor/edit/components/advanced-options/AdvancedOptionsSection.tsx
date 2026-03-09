"use client"

import { ReactNode } from "react"
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react"
import styles from "./AdvancedOptionsSection.module.css"

type Props = {
  showAdvanced: boolean
  onToggle: () => void
  children: ReactNode
}

export default function AdvancedOptionsSection({ showAdvanced, onToggle, children }: Props) {
  return (
    <>
      <button type="button" className={styles.advancedToggle} onClick={onToggle}>
        <Settings2 size={16} />
        <span>{showAdvanced ? "Ocultar opcoes avancadas" : "Opcoes avancadas"}</span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showAdvanced ? (
        <section className={styles.advancedSection}>
          <h2>Padroes do RPG</h2>
          <p>Defina atributos, status, pericias e se o RPG usa racas/classes.</p>
          {children}
        </section>
      ) : null}
    </>
  )
}
