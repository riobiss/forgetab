"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import styles from "./AbilityCategoriesSection.module.css"
import RadixSwitchField from "../shared/RadixSwitchField"
import { abilityCategoryDefinitions, type AbilityCategoryKey } from "@/lib/rpg/abilityCategories"

type Props = {
  showList: boolean
  onToggleList: () => void
  abilityCategoriesEnabled: boolean
  enabledAbilityCategories: AbilityCategoryKey[]
  onAbilityCategoriesEnabledChange: (value: boolean) => void
  onToggleCategory: (category: AbilityCategoryKey) => void
}

export default function AbilityCategoriesSection({
  showList,
  onToggleList,
  abilityCategoriesEnabled,
  enabledAbilityCategories,
  onAbilityCategoriesEnabledChange,
  onToggleCategory,
}: Props) {
  return (
    <section className={styles.section}>
      <h3>Habilidades</h3>
      <div className={styles.headerActions}>
        <button type="button" onClick={onToggleList}>
          {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showList ? "Ocultar categorias" : "Mostrar categorias"}
        </button>
      </div>
      <RadixSwitchField
        id="edit-rpg-ability-categories-enabled"
        label="Habilitar sistema de Categorias de Habilidades"
        description={
          abilityCategoriesEnabled
            ? "Ativo: novas habilidades exigem categoria habilitada."
            : "Inativo: criacao de habilidade sem categoria."
        }
        checked={abilityCategoriesEnabled}
        onCheckedChange={onAbilityCategoriesEnabledChange}
      />

      {showList ? (
        <div className={styles.list}>
          {abilityCategoryDefinitions.map((category) => (
            <RadixSwitchField
              key={category.key}
              id={`edit-rpg-ability-category-${category.key}`}
              label={category.label}
              description={category.description}
              checked={enabledAbilityCategories.includes(category.key)}
              onCheckedChange={() => onToggleCategory(category.key)}
            />
          ))}
        </div>
      ) : null}

      {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
        <p className={styles.warning}>Ative pelo menos uma categoria</p>
      ) : null}
    </section>
  )
}
