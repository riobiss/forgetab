import type { CharacterInventoryItemDto } from "@forgetab/world-contracts/character-inventory"
import type { PurchasedAbilityViewDto } from "@/features/world/characters/application/abilities/types"
import type {
  NpcMonsterExtraFieldDto,
  NpcMonsterNarrativeStatus,
  NpcMonsterNumericInputValue,
  NpcMonsterSecretFieldKey
} from "@/features/world/characters/application/npc-monster"
import type {
  NpcMonsterLoadoutItemOptionDto,
  NpcMonsterLoadoutSkillOptionDto
} from "@/features/world/characters/application/loadout/types"

export type StepKey = "basic" | "bonus" | "inventory" | "abilities"
export type NarrativeStatus = NpcMonsterNarrativeStatus
export type SecretFieldKey = NpcMonsterSecretFieldKey
export type NumericInputValue = NpcMonsterNumericInputValue
export type PickerMode = "inventory" | "abilities" | null

export type ExtraField = NpcMonsterExtraFieldDto & {
  id: string
}

export type NpcMonsterFormState = {
  name: string
  titleNickname: string
  description: string
  visibility: "private" | "public"
  narrativeStatus: NarrativeStatus
  secretFieldKeys: SecretFieldKey[]
  raceLabel: string
  classLabel: string
  image: string
  statusValues: Record<string, NumericInputValue>
  attributeValues: Record<string, NumericInputValue>
  skillValues: Record<string, NumericInputValue>
  extraFields: ExtraField[]
}

export type NpcMonsterLoadoutState = {
  inventory: CharacterInventoryItemDto[]
  inventoryLoading: boolean
  inventoryError: string
  availableItems: NpcMonsterLoadoutItemOptionDto[]
  itemsLoading: boolean
  abilities: PurchasedAbilityViewDto[]
  abilitiesLoading: boolean
  abilitiesError: string
  availableSkills: NpcMonsterLoadoutSkillOptionDto[]
  skillsLoading: boolean
}
