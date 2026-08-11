import { useDeferredValue, useMemo, useState } from "react"
import { baseItemRarityValues } from "@forgetab/world-contracts/validation/baseItem"
import type { BaseItem, ItemType } from "./types"
import { parseCustomFieldList } from "./utils"
import { matchesSearch } from "@forgetab/world-contracts/shared/search"

type UseItemsFiltersParams = {
  items: BaseItem[]
}

export function useItemsFilters({ items }: UseItemsFiltersParams) {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [searchOpen, setSearchOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ItemType | "all">(
    "all"
  )
  const [selectedRarity, setSelectedRarity] = useState<
    (typeof baseItemRarityValues)[number] | "all"
  >("all")
  const [showCategories, setShowCategories] = useState(false)

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ? true : item.type === selectedCategory
      const matchesRarity =
        selectedRarity === "all" ? true : item.rarity === selectedRarity

      if (!matchesCategory || !matchesRarity) {
        return false
      }

      const customFields = parseCustomFieldList(item.customFields)
      return matchesSearch(
        [
          item.name,
          item.description,
          item.type,
          item.rarity,
          item.preRequirement,
          item.ability,
          item.abilityName,
          ...customFields.flatMap((field) => [field.name, field.value])
        ],
        deferredSearch
      )
    })
  }, [deferredSearch, items, selectedCategory, selectedRarity])

  return {
    search,
    setSearch,
    searchOpen,
    setSearchOpen,
    selectedCategory,
    setSelectedCategory,
    selectedRarity,
    setSelectedRarity,
    showCategories,
    setShowCategories,
    visibleItems
  }
}
