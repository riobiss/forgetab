"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { CharacterAbilitiesDependencies } from "@/features/world/characters/application/abilities/contracts/CharacterAbilitiesDependencies"
import type { PurchasedAbilityViewDto } from "@/features/world/characters/application/abilities/types"
import {
  collectAbilityTags,
  collectAbilityValues,
  filterPurchasedAbilities,
  mergeCatalogValues
} from "@/features/world/characters/application/abilities/abilityFilters"
import { removeCharacterAbilityUseCase } from "@/features/world/characters/application/abilities/use-cases/characterAbilities"
import {
  SKILL_ACTION_TYPE_LABEL,
  SKILL_TYPE_LABEL
} from "./abilityPresentation"

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

export function useAbilitiesFiltersController(params: {
  characterId: string
  abilities: PurchasedAbilityViewDto[]
  deps: CharacterAbilitiesDependencies
}) {
  const [abilityItems, setAbilityItems] = useState(params.abilities)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [categories, setCategories] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [actionTypes, setActionTypes] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedAbility, setSelectedAbility] =
    useState<PurchasedAbilityViewDto | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState("")

  useEffect(() => setAbilityItems(params.abilities), [params.abilities])

  useEffect(() => {
    if (!selectedAbility) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedAbility])

  const options = useMemo(
    () => ({
      categories: collectAbilityValues(
        abilityItems,
        (ability) => ability.skillCategory
      ),
      types: mergeCatalogValues(
        Object.keys(SKILL_TYPE_LABEL),
        collectAbilityValues(abilityItems, (ability) => ability.skillType)
      ),
      actionTypes: mergeCatalogValues(
        Object.keys(SKILL_ACTION_TYPE_LABEL),
        collectAbilityValues(abilityItems, (ability) => ability.skillActionType)
      ),
      tags: collectAbilityTags(abilityItems)
    }),
    [abilityItems]
  )

  const filteredAbilities = useMemo(
    () =>
      filterPurchasedAbilities(abilityItems, {
        search: deferredSearch,
        categories,
        types,
        actionTypes,
        tags
      }),
    [abilityItems, actionTypes, categories, deferredSearch, tags, types]
  )

  async function removeSelectedAbility() {
    if (!selectedAbility || removing) return
    setRemoving(true)
    setRemoveError("")

    try {
      const payload = await removeCharacterAbilityUseCase(params.deps, {
        characterId: params.characterId,
        skillId: selectedAbility.skillId,
        level: selectedAbility.levelNumber
      })
      if (!payload.success) {
        setRemoveError("Nao foi possivel remover a habilidade.")
        return
      }

      setAbilityItems((current) =>
        current.filter(
          (ability) =>
            ability.skillId !== selectedAbility.skillId ||
            ability.levelNumber !== selectedAbility.levelNumber
        )
      )
      setSelectedAbility(null)
    } catch (cause) {
      setRemoveError(
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao remover habilidade."
      )
    } finally {
      setRemoving(false)
    }
  }

  return {
    search,
    setSearch,
    filtersOpen,
    setFiltersOpen,
    selectedAbility,
    removing,
    removeError,
    options,
    filteredAbilities,
    selectedFilters: { categories, types, actionTypes, tags },
    activeFilters:
      categories.length + types.length + actionTypes.length + tags.length,
    selectAbility(ability: PurchasedAbilityViewDto) {
      setRemoveError("")
      setSelectedAbility(ability)
    },
    closeAbility() {
      setSelectedAbility(null)
    },
    toggleCategory(value: string) {
      setCategories((current) => toggleValue(current, value))
    },
    toggleType(value: string) {
      setTypes((current) => toggleValue(current, value))
    },
    toggleActionType(value: string) {
      setActionTypes((current) => toggleValue(current, value))
    },
    toggleTag(value: string) {
      setTags((current) => toggleValue(current, value))
    },
    clearFilters() {
      setCategories([])
      setTypes([])
      setActionTypes([])
      setTags([])
    },
    removeSelectedAbility
  }
}
