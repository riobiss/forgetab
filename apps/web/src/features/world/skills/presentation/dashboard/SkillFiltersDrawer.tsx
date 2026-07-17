import { type ActionType, type SkillTag, type SkillType } from "@/types/skillBuilder"
import { actionTypeLabel, skillTagLabel, skillTypeLabel } from "./constants"
import styles from "./SkillsDashboardClient.module.css"

type SkillFiltersDrawerProps = {
  open: boolean
  categoryFilterOptions: string[]
  typeFilterOptions: string[]
  actionTypeFilterOptions: string[]
  tagFilterOptions: string[]
  selectedCategoryFilters: string[]
  selectedTypeFilters: string[]
  selectedActionTypeFilters: string[]
  selectedTagFilters: string[]
  onClose: () => void
  onToggleCategory: (item: string) => void
  onToggleType: (item: string) => void
  onToggleActionType: (item: string) => void
  onToggleTag: (tag: string) => void
  onClear: () => void
  resolveCategoryLabel: (value: string) => string
}

export function SkillFiltersDrawer({
  open,
  categoryFilterOptions,
  typeFilterOptions,
  actionTypeFilterOptions,
  tagFilterOptions,
  selectedCategoryFilters,
  selectedTypeFilters,
  selectedActionTypeFilters,
  selectedTagFilters,
  onClose,
  onToggleCategory,
  onToggleType,
  onToggleActionType,
  onToggleTag,
  onClear,
  resolveCategoryLabel,
}: SkillFiltersDrawerProps) {
  if (!open) return null

  return (
    <>
      <button type="button" className={styles.drawerBackdrop} aria-label="Fechar filtros" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Filtros de habilidades">
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Filtros</h3>
          <button type="button" className={styles.drawerClose} onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className={styles.drawerTagsSection}>
          <span className={styles.searchBarLabel}>Categoria</span>
          <div className={styles.chipsRow}>
            {categoryFilterOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  selectedCategoryFilters.includes(item)
                    ? `${styles.chipButton} ${styles.chipButtonActive}`
                    : styles.chipButton
                }
                onClick={() => onToggleCategory(item)}
              >
                {resolveCategoryLabel(item)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.drawerTagsSection}>
          <span className={styles.searchBarLabel}>Tipo</span>
          <div className={styles.chipsRow}>
            {typeFilterOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  selectedTypeFilters.includes(item)
                    ? `${styles.chipButton} ${styles.chipButtonActive}`
                    : styles.chipButton
                }
                onClick={() => onToggleType(item)}
              >
                {skillTypeLabel[item as SkillType] ?? item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.drawerTagsSection}>
          <span className={styles.searchBarLabel}>Ação</span>
          <div className={styles.chipsRow}>
            {actionTypeFilterOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  selectedActionTypeFilters.includes(item)
                    ? `${styles.chipButton} ${styles.chipButtonActive}`
                    : styles.chipButton
                }
                onClick={() => onToggleActionType(item)}
              >
                {actionTypeLabel[item as ActionType] ?? item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.drawerTagsSection}>
          <span className={styles.searchBarLabel}>Tags</span>
          <div className={styles.chipsRow}>
            {tagFilterOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={
                  selectedTagFilters.includes(tag)
                    ? `${styles.chipButton} ${styles.chipButtonActive}`
                    : styles.chipButton
                }
                onClick={() => onToggleTag(tag)}
              >
                {skillTagLabel[tag as SkillTag] ?? tag}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className={styles.drawerClear} onClick={onClear}>
          Limpar filtros
        </button>
      </aside>
    </>
  )
}
