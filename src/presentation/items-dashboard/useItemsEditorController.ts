import { useCallback, useState, type Dispatch, type SetStateAction } from "react"
import { baseItemRarityValues } from "@/lib/validators/baseItem"
import {
  createEmptyNamedDescription,
  mapItemToEditorState,
  type CustomField,
  type NamedDescription,
} from "./editorState"
import type { BaseItem, ItemType } from "./types"

type UseItemsEditorControllerParams = {
  items: BaseItem[]
  resetItemEditorAssets: () => void
  setCustomFields: Dispatch<SetStateAction<CustomField[]>>
  setUploadError: Dispatch<SetStateAction<string>>
  setSelectedImageFile: Dispatch<SetStateAction<File | null>>
  setSelectedImagePreviewUrl: Dispatch<SetStateAction<string>>
  setPendingImageRemoval: Dispatch<SetStateAction<boolean>>
}

export function useItemsEditorController({
  items,
  resetItemEditorAssets,
  setCustomFields,
  setUploadError,
  setSelectedImageFile,
  setSelectedImagePreviewUrl,
  setPendingImageRemoval,
}: UseItemsEditorControllerParams) {
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

  const resetForm = useCallback(() => {
    setEditorTab("basic")
    setEditorError("")
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
    resetItemEditorAssets()
  }, [resetItemEditorAssets])

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

  const openEditModal = useCallback(
    async (itemId: string) => {
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
    },
    [
      items,
      setCustomFields,
      setPendingImageRemoval,
      setSelectedImageFile,
      setSelectedImagePreviewUrl,
      setUploadError,
    ],
  )

  return {
    editorOpen,
    editorMode,
    editingItemId,
    editorTab,
    setEditorTab,
    editorLoading,
    setEditorLoading,
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
    resetForm,
    openCreateModal,
    closeEditorModal,
    openEditModal,
  }
}
