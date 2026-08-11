"use client"

import { Filter } from "lucide-react"
import type { CharacterAbilitiesDependencies } from "@/features/world/characters/application/abilities/contracts/CharacterAbilitiesDependencies"
import type { PurchasedAbilityViewDto } from "@/features/world/characters/application/abilities/types"
import { AbilitiesFilterDrawer } from "./AbilitiesFilterDrawer"
import { AbilityCard } from "./AbilityCard"
import { AbilityDetailsModal } from "./AbilityDetailsModal"
import { useAbilitiesFiltersController } from "./useAbilitiesFiltersController"
import styles from "./CharacterAbilitiesPage.module.css"

export default function AbilitiesFiltersClient(props: {
  characterId: string
  abilities: PurchasedAbilityViewDto[]
  deps: CharacterAbilitiesDependencies
  canManage?: boolean
}) {
  const controller = useAbilitiesFiltersController(props)

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.filtersTopRow}>
          <label
            className={`${styles.filterField} ${styles.filterFieldSearch}`}
          >
            <input
              type="search"
              value={controller.search}
              onChange={(event) => controller.setSearch(event.target.value)}
              placeholder="Buscar..."
            />
          </label>
          <button
            type="button"
            className={styles.filtersIconButton}
            onClick={() => controller.setFiltersOpen(true)}
            aria-label="Abrir filtros"
            aria-haspopup="dialog"
            aria-expanded={controller.filtersOpen}
            aria-controls="abilities-filters-drawer"
            title="Filtros"
          >
            <Filter size={18} aria-hidden="true" />
            {controller.activeFilters > 0 ? (
              <span className={styles.filtersCount}>
                {controller.activeFilters}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {controller.filtersOpen ? (
        <AbilitiesFilterDrawer
          categories={controller.options.categories}
          types={controller.options.types}
          actionTypes={controller.options.actionTypes}
          tags={controller.options.tags}
          selectedCategories={controller.selectedFilters.categories}
          selectedTypes={controller.selectedFilters.types}
          selectedActionTypes={controller.selectedFilters.actionTypes}
          selectedTags={controller.selectedFilters.tags}
          onToggleCategory={controller.toggleCategory}
          onToggleType={controller.toggleType}
          onToggleActionType={controller.toggleActionType}
          onToggleTag={controller.toggleTag}
          onClear={controller.clearFilters}
          onClose={() => controller.setFiltersOpen(false)}
        />
      ) : null}

      {controller.filteredAbilities.length === 0 ? (
        <p className={styles.emptyState}>
          Nenhuma habilidade encontrada com os filtros atuais.
        </p>
      ) : (
        <div className={styles.cardGrid}>
          {controller.filteredAbilities.map((ability) => (
            <AbilityCard
              key={`${ability.skillId}:${ability.levelNumber}`}
              ability={ability}
              onSelect={controller.selectAbility}
            />
          ))}
        </div>
      )}

      {controller.selectedAbility ? (
        <AbilityDetailsModal
          ability={controller.selectedAbility}
          canManage={props.canManage ?? true}
          removing={controller.removing}
          removeError={controller.removeError}
          onClose={controller.closeAbility}
          onRemove={() => void controller.removeSelectedAbility()}
        />
      ) : null}
    </>
  )
}
