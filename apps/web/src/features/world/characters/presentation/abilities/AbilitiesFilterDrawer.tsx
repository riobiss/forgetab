import { getSkillTagMeta } from "@forgetab/world-contracts/rpg/skillTags"
import {
  toActionTypeLabel,
  toCategoryLabel,
  toTypeLabel
} from "./abilityPresentation"
import styles from "./CharacterAbilitiesPage.module.css"

type ChipGroupProps = {
  label: string
  options: string[]
  selected: string[]
  getLabel: (value: string) => string | null
  onToggle: (value: string) => void
  emptyText?: string
}

function ChipGroup({
  label,
  options,
  selected,
  getLabel,
  onToggle,
  emptyText
}: ChipGroupProps) {
  return (
    <div className={styles.drawerTagsSection}>
      <span className={styles.typesLabel}>{label}</span>
      <div className={styles.typeChips}>
        {options.length === 0 && emptyText ? (
          <p className={styles.drawerEmptyText}>{emptyText}</p>
        ) : (
          options.map((option) => (
            <button
              key={option}
              type="button"
              className={
                selected.includes(option)
                  ? `${styles.typeChip} ${styles.typeChipActive}`
                  : styles.typeChip
              }
              onClick={() => onToggle(option)}
            >
              {getLabel(option)}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

type Props = {
  categories: string[]
  types: string[]
  actionTypes: string[]
  tags: string[]
  selectedCategories: string[]
  selectedTypes: string[]
  selectedActionTypes: string[]
  selectedTags: string[]
  onToggleCategory: (value: string) => void
  onToggleType: (value: string) => void
  onToggleActionType: (value: string) => void
  onToggleTag: (value: string) => void
  onClear: () => void
  onClose: () => void
}

export function AbilitiesFilterDrawer(props: Props) {
  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        aria-label="Fechar filtros"
        onClick={props.onClose}
      />
      <aside
        id="abilities-filters-drawer"
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Filtros</h3>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={props.onClose}
            aria-label="Fechar"
          >
            Fechar
          </button>
        </div>

        <ChipGroup
          label="Categoria"
          options={props.categories}
          selected={props.selectedCategories}
          getLabel={toCategoryLabel}
          onToggle={props.onToggleCategory}
        />
        <ChipGroup
          label="Tipo"
          options={props.types}
          selected={props.selectedTypes}
          getLabel={toTypeLabel}
          onToggle={props.onToggleType}
        />
        <ChipGroup
          label="Tipo da ação"
          options={props.actionTypes}
          selected={props.selectedActionTypes}
          getLabel={toActionTypeLabel}
          onToggle={props.onToggleActionType}
        />
        <ChipGroup
          label="Tags"
          options={props.tags}
          selected={props.selectedTags}
          getLabel={(tag) => getSkillTagMeta(tag)?.label ?? tag}
          onToggle={props.onToggleTag}
          emptyText="Nenhuma tag disponivel."
        />

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.drawerClear}
            onClick={props.onClear}
          >
            Limpar filtros
          </button>
        </div>
      </aside>
    </>
  )
}
