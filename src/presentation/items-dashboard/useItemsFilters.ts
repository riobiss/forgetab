import { useMemo, useState } from "react"
import { baseItemRarityValues } from "@/lib/validators/baseItem"
import type { BaseItem, ItemType } from "./types"
import { parseCustomFieldList } from "./utils"

type UseItemsFiltersParams = {
  items: BaseItem[]
}

export function useItemsFilters({ items }: UseItemsFiltersParams) {
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ItemType | "all">("all")
  const [selectedRarity, setSelectedRarity] = useState<
    (typeof baseItemRarityValues)[number] | "all"
  >("all")
  const [showCategories, setShowCategories] = useState(false)

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesCategory = selectedCategory === "all" ? true : item.type === selectedCategory
      const matchesRarity = selectedRarity === "all" ? true : item.rarity === selectedRarity

      if (!matchesCategory || !matchesRarity) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.description ?? "").toLowerCase().includes(normalizedSearch) ||
        item.type.toLowerCase().includes(normalizedSearch) ||
        item.rarity.toLowerCase().includes(normalizedSearch) ||
        (item.preRequirement ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.ability ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.abilityName ?? "").toLowerCase().includes(normalizedSearch) ||
        parseCustomFieldList(item.customFields).some(
          (field) =>
            field.name.toLowerCase().includes(normalizedSearch) ||
            field.value.toLowerCase().includes(normalizedSearch),
        )
      )
    })
  }, [items, search, selectedCategory, selectedRarity])

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
    visibleItems,
  }
}
