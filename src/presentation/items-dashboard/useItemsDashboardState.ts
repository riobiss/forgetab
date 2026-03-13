import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import { loadItemsDashboardData } from "@/application/itemsDashboard/use-cases/itemsDashboard"
import { baseItemRarityValues, baseItemTypeValues } from "@/lib/validators/baseItem"
import type { BaseItem, CharacterSummary, ItemType } from "./types"
import {
  buildItemPayload,
  createEmptyNamedDescription,
  updateNamedEntry,
  type NamedDescription,
} from "./editorState"
import { useItemEditorAssets } from "./useItemEditorAssets"
import { useItemsEditorController } from "./useItemsEditorController"
import { useItemsDashboardActions } from "./useItemsDashboardActions"
import { useItemsFilters } from "./useItemsFilters"

type Params = {
  rpgId: string
  deps: ItemsDashboardDependencies
}

export function useItemsDashboardState({ rpgId, deps }: Params) {
  const [items, setItems] = useState<BaseItem[]>([])
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [giveModalItemId, setGiveModalItemId] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState("")
  const [giveQuantity, setGiveQuantity] = useState(1)
  const [giving, setGiving] = useState(false)
  const [giveError, setGiveError] = useState("")
  const [giveSuccess, setGiveSuccess] = useState("")
  const deletingRef = useRef(false)
  const givingRef = useRef(false)
  const savingRef = useRef(false)
  const {
    customFields,
    setCustomFields,
    customFieldModalOpen,
    setCustomFieldModalOpen,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    uploadingImage,
    setUploadingImage,
    uploadError,
    setUploadError,
    selectedImageFile,
    setSelectedImageFile,
    selectedImagePreviewUrl,
    setSelectedImagePreviewUrl,
    pendingImageRemoval,
    setPendingImageRemoval,
    resetItemEditorAssets,
    handleImageUpload,
    handleRemoveImage,
    addCustomField,
  } = useItemEditorAssets()
  const {
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
  } = useItemsFilters({ items })
  const {
    editorOpen,
    editorMode,
    editingItemId,
    editorTab,
    setEditorTab,
    editorLoading,
    editorSaving,
    setEditorSaving,
    editorError,
    setEditorError,
    name,
    setName,
    image,
    setImage,
    description,
    setDescription,
    preRequirement,
    setPreRequirement,
    type,
    setType,
    rarity,
    setRarity,
    damage,
    setDamage,
    range,
    setRange,
    weight,
    setWeight,
    duration,
    setDuration,
    durability,
    setDurability,
    abilities,
    setAbilities,
    effects,
    setEffects,
    openCreateModal,
    closeEditorModal,
    openEditModal,
  } = useItemsEditorController({
    items,
    resetItemEditorAssets,
    setCustomFields,
    setUploadError,
    setSelectedImageFile,
    setSelectedImagePreviewUrl,
    setPendingImageRemoval,
  })

  const selectedGiveItem = useMemo(
    () => items.find((item) => item.id === giveModalItemId) ?? null,
    [items, giveModalItemId],
  )
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")
      const payload = await loadItemsDashboardData(deps, { rpgId })
      setItems(payload.items as BaseItem[])
      setCharacters(payload.characters as CharacterSummary[])
    } catch (cause) {
      setLoadingError(cause instanceof Error ? cause.message : "Erro de conexao ao carregar dados.")
      setItems([])
      setCharacters([])
    } finally {
      setLoading(false)
    }
  }, [deps, rpgId])

  useEffect(() => {
    if (!rpgId) return
    void loadData()
  }, [loadData, rpgId])

  const actions = useItemsDashboardActions({
    deps,
    rpgId,
    characters,
    items,
    selectedGiveItem,
    selectedCharacterId,
    giveQuantity,
    deletingRef,
    givingRef,
    savingRef,
    editorMode,
    editingItemId,
    selectedImageFile,
    pendingImageRemoval,
    buildPayload: () =>
      buildItemPayload({
        name,
        image,
        description,
        preRequirement,
        type,
        rarity,
        damage,
        range,
        weight,
        duration,
        durability,
        abilities,
        effects,
        customFields,
        pendingImageRemoval,
      }),
    setItems,
    setLoadingError,
    setDeletingItemId,
    setGiveModalItemId,
    setSelectedCharacterId,
    setGiveQuantity,
    setGiveError,
    setGiveSuccess,
    setGiving,
    setEditorSaving,
    setEditorError,
    setUploadError,
    setUploadingImage,
    closeEditorModal,
  })

  return {
    baseItemTypeValues,
    baseItemRarityValues,
    items,
    characters,
    loading,
    loadingError,
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
    deletingItemId,
    selectedCharacterId,
    setSelectedCharacterId,
    giveQuantity,
    setGiveQuantity,
    giving,
    giveError,
    giveSuccess,
    visibleItems,
    selectedGiveItem,
    editorOpen,
    editorMode,
    editingItemId,
    editorTab,
    setEditorTab,
    editorLoading,
    editorSaving,
    editorError,
    name,
    setName,
    image,
    description,
    setDescription,
    preRequirement,
    setPreRequirement,
    type,
    setType,
    rarity,
    setRarity,
    damage,
    setDamage,
    range,
    setRange,
    weight,
    setWeight,
    duration,
    setDuration,
    durability,
    setDurability,
    abilities,
    setAbilities,
    effects,
    setEffects,
    customFields,
    setCustomFields,
    customFieldModalOpen,
    setCustomFieldModalOpen,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    uploadingImage,
    uploadError,
    selectedImageFile,
    selectedImagePreviewUrl,
    pendingImageRemoval,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    openGiveModal: actions.openGiveModal,
    closeGiveModal: actions.closeGiveModal,
    handleDelete: actions.handleDelete,
    handleGiveItem: actions.handleGiveItem,
    handleSaveItem: actions.handleSaveItem,
    handleImageUpload: (file: File) =>
      handleImageUpload(file, { clearErrors: () => setEditorError("") }),
    handleRemoveImage: () => {
      handleRemoveImage(image, { clearErrors: () => setEditorError("") })
      setImage("")
    },
    addCustomField: () =>
      addCustomField({
        onMissingName: () => setEditorError("Informe o nome do novo campo."),
        onAdded: () => setEditorError(""),
      }),
    updateNamedEntry,
    createEmptyNamedDescription,
  }
}
