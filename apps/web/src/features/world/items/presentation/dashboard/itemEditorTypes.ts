import type { Dispatch, SetStateAction } from "react"
import type {
  ItemRarityDto,
  ItemTypeDto
} from "@/features/world/items/application/dashboard/types"
import type { CustomField, NamedDescription } from "./editorState"

export type { CustomField, NamedDescription } from "./editorState"

export type ItemEditorTab = "basic" | "requirements" | "abilities" | "effects"

export type ItemUpsertModalProps = {
  open: boolean
  mode: "create" | "edit"
  tab: ItemEditorTab
  setTab: Dispatch<SetStateAction<ItemEditorTab>>
  loading: boolean
  saving: boolean
  error: string
  uploadError: string
  name: string
  setName: Dispatch<SetStateAction<string>>
  description: string
  setDescription: Dispatch<SetStateAction<string>>
  preRequirement: string
  setPreRequirement: Dispatch<SetStateAction<string>>
  type: ItemTypeDto
  setType: (value: ItemTypeDto) => void
  rarity: ItemRarityDto
  setRarity: (value: ItemRarityDto) => void
  damage: string
  setDamage: Dispatch<SetStateAction<string>>
  range: string
  setRange: Dispatch<SetStateAction<string>>
  weight: string
  setWeight: Dispatch<SetStateAction<string>>
  duration: string
  setDuration: Dispatch<SetStateAction<string>>
  durability: string
  setDurability: Dispatch<SetStateAction<string>>
  abilities: NamedDescription[]
  setAbilities: Dispatch<SetStateAction<NamedDescription[]>>
  effects: NamedDescription[]
  setEffects: Dispatch<SetStateAction<NamedDescription[]>>
  customFields: CustomField[]
  setCustomFields: Dispatch<SetStateAction<CustomField[]>>
  image: string
  selectedImageFile: File | null
  selectedImagePreviewUrl: string
  uploadingImage: boolean
  customFieldModalOpen: boolean
  setCustomFieldModalOpen: Dispatch<SetStateAction<boolean>>
  newCustomFieldName: string
  setNewCustomFieldName: Dispatch<SetStateAction<string>>
  newCustomFieldValue: string
  setNewCustomFieldValue: Dispatch<SetStateAction<string>>
  baseItemTypeValues: readonly ItemTypeDto[]
  baseItemRarityValues: readonly ItemRarityDto[]
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
  onImageUpload: (file: File) => void
  onRemoveImage: () => void
  onAddCustomField: () => void
  updateNamedEntry: (
    list: NamedDescription[],
    index: number,
    field: keyof NamedDescription,
    value: string
  ) => NamedDescription[]
  createEmptyNamedDescription: () => NamedDescription
}
