import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import { loadItemsDashboardData } from "@/application/itemsDashboard/use-cases/itemsDashboard"
import type { UpsertItemPayloadDto } from "@/application/itemsEditor/types"
import { baseItemRarityValues, baseItemTypeValues } from "@/lib/validators/baseItem"
import type { BaseItem, CharacterSummary, ItemType } from "./types"
import { useItemsDashboardActions } from "./useItemsDashboardActions"
import { parseCustomFieldList, parseNamedDescriptionList } from "./utils"

type NamedDescription = {
  name: string
  description: string
}

type CustomField = {
  id: string
  name: string
  value: string
}

type Params = {
  rpgId: string
  deps: ItemsDashboardDependencies
}

function createEmptyNamedDescription(): NamedDescription {
  return { name: "", description: "" }
}

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toOptionalNumber(value: string, parser: (raw: string) => number) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = parser(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function mapItemToEditorState(item: BaseItem) {
  const nextAbilities = parseNamedDescriptionList(item.abilities)
  const nextEffects = parseNamedDescriptionList(item.effects)

  return {
    name: item.name,
    image: item.image ?? "",
    description: item.description ?? "",
    preRequirement: item.preRequirement ?? "",
    type: item.type,
    rarity: item.rarity as (typeof baseItemRarityValues)[number],
    damage: item.damage ?? "",
    range: item.range ?? "",
    weight: item.weight !== null ? String(item.weight) : "",
    duration: item.duration ?? "",
    durability: item.durability !== null ? String(item.durability) : "",
    abilities:
      nextAbilities.length > 0
        ? nextAbilities
        : item.abilityName || item.ability
          ? [{ name: item.abilityName ?? "", description: item.ability ?? "" }]
          : [createEmptyNamedDescription()],
    effects:
      nextEffects.length > 0
        ? nextEffects
        : item.effectName || item.effect
          ? [{ name: item.effectName ?? "", description: item.effect ?? "" }]
          : [createEmptyNamedDescription()],
    customFields: parseCustomFieldList(item.customFields).map((field, index) => ({
      id: `custom-${index}-${field.name}`,
      ...field,
    })),
  }
}

export function useItemsDashboardState({ rpgId, deps }: Params) {
  const [items, setItems] = useState<BaseItem[]>([])
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ItemType | "all">("all")
  const [selectedRarity, setSelectedRarity] = useState<(typeof baseItemRarityValues)[number] | "all">("all")
  const [showCategories, setShowCategories] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [giveModalItemId, setGiveModalItemId] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState("")
  const [giveQuantity, setGiveQuantity] = useState(1)
  const [giving, setGiving] = useState(false)
  const [giveError, setGiveError] = useState("")
  const [giveSuccess, setGiveSuccess] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editorTab, setEditorTab] = useState<"basic" | "requirements" | "abilities" | "effects">("basic")
  const [editorLoading, setEditorLoading] = useState(false)
  const [editorSaving, setEditorSaving] = useState(false)
  const [editorError, setEditorError] = useState("")
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  const [preRequirement, setPreRequirement] = useState("")
  const [type, setType] = useState<ItemType>("equipment")
  const [rarity, setRarity] = useState<(typeof baseItemRarityValues)[number]>("common")
  const [damage, setDamage] = useState("")
  const [range, setRange] = useState("")
  const [weight, setWeight] = useState("")
  const [duration, setDuration] = useState("")
  const [durability, setDurability] = useState("")
  const [abilities, setAbilities] = useState<NamedDescription[]>([createEmptyNamedDescription()])
  const [effects, setEffects] = useState<NamedDescription[]>([createEmptyNamedDescription()])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false)
  const [newCustomFieldName, setNewCustomFieldName] = useState("")
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("")
  const [pendingImageRemoval, setPendingImageRemoval] = useState(false)
  const deletingRef = useRef(false)
  const givingRef = useRef(false)
  const savingRef = useRef(false)

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

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl)
      }
    }
  }, [selectedImagePreviewUrl])

  const resetForm = useCallback(() => {
    setEditorTab("basic")
    setEditorError("")
    setUploadError("")
    setName("")
    setImage("")
    setDescription("")
    setPreRequirement("")
    setType("equipment")
    setRarity("common")
    setDamage("")
    setRange("")
    setWeight("")
    setDuration("")
    setDurability("")
    setAbilities([createEmptyNamedDescription()])
    setEffects([createEmptyNamedDescription()])
    setCustomFields([])
    setSelectedImageFile(null)
    setSelectedImagePreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }
      return ""
    })
    setPendingImageRemoval(false)
    setCustomFieldModalOpen(false)
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
  }, [])

  const openCreateModal = useCallback(() => {
    setEditorMode("create")
    setEditingItemId(null)
    resetForm()
    setEditorOpen(true)
  }, [resetForm])

  const closeEditorModal = useCallback(() => {
    setEditorOpen(false)
    setEditingItemId(null)
    setEditorLoading(false)
    resetForm()
  }, [resetForm])

  const openEditModal = useCallback(async (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId)
    setEditorMode("edit")
    setEditingItemId(itemId)
    setEditorOpen(true)
    setEditorError("")
    setUploadError("")
    setEditorTab("basic")

    if (selectedItem) {
      const mapped = mapItemToEditorState(selectedItem)
      setName(mapped.name)
      setImage(mapped.image)
      setDescription(mapped.description)
      setPreRequirement(mapped.preRequirement)
      setType(mapped.type)
      setRarity(mapped.rarity)
      setDamage(mapped.damage)
      setRange(mapped.range)
      setWeight(mapped.weight)
      setDuration(mapped.duration)
      setDurability(mapped.durability)
      setAbilities(mapped.abilities)
      setEffects(mapped.effects)
      setCustomFields(mapped.customFields)
      setSelectedImageFile(null)
      setSelectedImagePreviewUrl((previousPreviewUrl) => {
        if (previousPreviewUrl) {
          URL.revokeObjectURL(previousPreviewUrl)
        }
        return ""
      })
      setPendingImageRemoval(false)
      setEditorLoading(false)
      return
    }

    setEditorLoading(false)
    setEditorError("Nao foi possivel localizar o item na lista carregada.")
  }, [items])

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
    buildPayload: () => {
      const normalizedAbilities = abilities
        .map((entry) => ({
          name: entry.name.trim(),
          description: entry.description.trim(),
        }))
        .filter((entry) => entry.description)

      const normalizedEffects = effects
        .map((entry) => ({
          name: entry.name.trim(),
          description: entry.description.trim(),
        }))
        .filter((entry) => entry.description)

      return {
      name,
      image: pendingImageRemoval ? null : toOptionalText(image),
      description: toOptionalText(description),
      preRequirement: toOptionalText(preRequirement),
      type,
      rarity,
      damage: toOptionalText(damage),
      range: toOptionalText(range),
      abilityName: normalizedAbilities[0]?.name || null,
      ability: normalizedAbilities[0]?.description ?? null,
      effectName: normalizedEffects[0]?.name || null,
      effect: normalizedEffects[0]?.description ?? null,
      abilities: normalizedAbilities,
      effects: normalizedEffects,
      customFields: customFields
        .map((field) => ({
          name: field.name.trim(),
          value: toOptionalText(field.value),
        }))
        .filter((field) => field.name),
      weight: toOptionalNumber(weight, Number.parseFloat),
      duration: toOptionalText(duration),
      durability: toOptionalNumber(durability, (raw) => Number.parseInt(raw, 10)),
      } satisfies UpsertItemPayloadDto
    },
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

  function updateNamedEntry(
    list: NamedDescription[],
    index: number,
    field: keyof NamedDescription,
    value: string,
  ) {
    return list.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry,
    )
  }

  function handleImageUpload(file: File) {
    setSelectedImagePreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }
      return URL.createObjectURL(file)
    })

    setSelectedImageFile(file)
    setPendingImageRemoval(false)
    setUploadError("")
    setEditorError("")
  }

  function handleRemoveImage() {
    setSelectedImagePreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }
      return ""
    })
    setSelectedImageFile(null)
    setPendingImageRemoval(image.trim().length > 0)
    setImage("")
    setUploadError("")
    setEditorError("")
  }

  function addCustomField() {
    const trimmedName = newCustomFieldName.trim()
    if (!trimmedName) {
      setEditorError("Informe o nome do novo campo.")
      return
    }

    setCustomFields((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmedName,
        value: newCustomFieldValue,
      },
    ])
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
    setCustomFieldModalOpen(false)
    setEditorError("")
  }

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
    handleImageUpload,
    handleRemoveImage,
    addCustomField,
    updateNamedEntry,
    createEmptyNamedDescription,
  }
}
