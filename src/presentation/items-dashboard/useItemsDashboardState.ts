import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { baseItemTypeValues } from "@/lib/validators/baseItem"
import type {
  ApiCharactersPayload,
  ApiListPayload,
  BaseItem,
  CharacterSummary,
  ItemType,
} from "./types"
import { useItemsDashboardActions } from "./useItemsDashboardActions"

type Params = { rpgId: string }

export function useItemsDashboardState({ rpgId }: Params) {
  const [items, setItems] = useState<BaseItem[]>([])
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ItemType | "all">("all")
  const [showCategories, setShowCategories] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [giveModalItemId, setGiveModalItemId] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState("")
  const [giveQuantity, setGiveQuantity] = useState(1)
  const [giving, setGiving] = useState(false)
  const [giveError, setGiveError] = useState("")
  const [giveSuccess, setGiveSuccess] = useState("")
  const deletingRef = useRef(false)
  const givingRef = useRef(false)

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesCategory = selectedCategory === "all" ? true : item.type === selectedCategory

      if (!matchesCategory) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.type.toLowerCase().includes(normalizedSearch) ||
        item.rarity.toLowerCase().includes(normalizedSearch) ||
        (item.preRequirement ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.ability ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.abilityName ?? "").toLowerCase().includes(normalizedSearch)
      )
    })
  }, [items, search, selectedCategory])

  const selectedGiveItem = useMemo(
    () => items.find((item) => item.id === giveModalItemId) ?? null,
    [items, giveModalItemId],
  )

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")

      const response = await fetch(`/api/rpg/${rpgId}/items`)
      const payload = (await response.json()) as ApiListPayload

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel carregar os itens.")
        setItems([])
        return
      }

      setItems(payload.items ?? [])
    } catch {
      setLoadingError("Erro de conexao ao carregar itens.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [rpgId])

  const loadCharacters = useCallback(async () => {
    try {
      const response = await fetch(`/api/rpg/${rpgId}/characters`)
      const payload = (await response.json()) as ApiCharactersPayload

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel carregar personagens.")
        setCharacters([])
        return
      }

      setCharacters(payload.characters ?? [])
    } catch {
      setLoadingError("Erro de conexao ao carregar personagens.")
      setCharacters([])
    }
  }, [rpgId])

  useEffect(() => {
    if (!rpgId) return
    void loadItems()
    void loadCharacters()
  }, [loadCharacters, loadItems, rpgId])

  const actions = useItemsDashboardActions({
    rpgId,
    characters,
    items,
    selectedGiveItem,
    selectedCharacterId,
    giveQuantity,
    deletingRef,
    givingRef,
    setItems,
    setLoadingError,
    setDeletingItemId,
    setGiveModalItemId,
    setSelectedCharacterId,
    setGiveQuantity,
    setGiveError,
    setGiveSuccess,
    setGiving,
  })

  return {
    baseItemTypeValues,
    items,
    characters,
    loading,
    loadingError,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    showCategories,
    setShowCategories,
    deletingItemId,
    giveModalItemId,
    selectedCharacterId,
    setSelectedCharacterId,
    giveQuantity,
    setGiveQuantity,
    giving,
    giveError,
    giveSuccess,
    visibleItems,
    selectedGiveItem,
    openGiveModal: actions.openGiveModal,
    closeGiveModal: actions.closeGiveModal,
    handleDelete: actions.handleDelete,
    handleGiveItem: actions.handleGiveItem,
  }
}
