import type {
  CharacterInventoryItemDto,
  CharacterInventoryRarityDto,
} from "@forgetab/world-contracts/character-inventory"
import type { InventoryCardItem } from "./types"
import { itemRarityLabel, itemTypeLabel } from "@/shared/items/itemLabels"
export {
  parseCustomFieldList,
  parseNamedDescriptionList,
} from "@/shared/items/itemFieldParsers"
import {
  parseCustomFieldList,
  parseNamedDescriptionList,
} from "@/shared/items/itemFieldParsers"

export function matchesInventorySearch(
  item: CharacterInventoryItemDto,
  normalizedSearch: string,
): boolean {
  if (!normalizedSearch) {
    return true
  }

  const abilities = parseNamedDescriptionList(item.itemAbilities)
  const effects = parseNamedDescriptionList(item.itemEffects)

  return (
    item.itemName.toLowerCase().includes(normalizedSearch) ||
    item.itemType.toLowerCase().includes(normalizedSearch) ||
    item.itemRarity.toLowerCase().includes(normalizedSearch) ||
    (item.itemDescription ?? "").toLowerCase().includes(normalizedSearch) ||
    (item.itemPreRequirement ?? "").toLowerCase().includes(normalizedSearch) ||
    (item.itemDamage ?? "").toLowerCase().includes(normalizedSearch) ||
    (item.itemDuration ?? "").toLowerCase().includes(normalizedSearch) ||
    (item.itemAbility ?? "").toLowerCase().includes(normalizedSearch) ||
    (item.itemAbilityName ?? "").toLowerCase().includes(normalizedSearch) ||
    (item.itemEffect ?? "").toLowerCase().includes(normalizedSearch) ||
    (item.itemEffectName ?? "").toLowerCase().includes(normalizedSearch) ||
    abilities.some(
      (ability) =>
        ability.name.toLowerCase().includes(normalizedSearch) ||
        ability.description.toLowerCase().includes(normalizedSearch),
    ) ||
    effects.some(
      (effect) =>
        effect.name.toLowerCase().includes(normalizedSearch) ||
        effect.description.toLowerCase().includes(normalizedSearch),
    )
  )
}

export function toInventoryCardItem(
  item: CharacterInventoryItemDto,
  rarityLabels: Record<CharacterInventoryRarityDto, string> = itemRarityLabel,
): InventoryCardItem {
  const abilities = parseNamedDescriptionList(item.itemAbilities)
  const effects = parseNamedDescriptionList(item.itemEffects)
  const coreStats: Array<{ label: string; value: string }> = []
  const abilityEntries: Array<{ name: string; description: string }> = []
  const effectEntries: Array<{ name: string; description: string }> = []
  const customFields = parseCustomFieldList(item.itemCustomFields)

  if (item.itemDamage) {
    coreStats.push({ label: "Dano", value: item.itemDamage })
  }
  if (item.itemRange) {
    coreStats.push({ label: "Alcance", value: item.itemRange })
  }
  if (item.itemWeight !== null) {
    coreStats.push({ label: "Peso", value: `${item.itemWeight} kg` })
  }
  if (item.itemDuration) {
    coreStats.push({ label: "Duracao", value: item.itemDuration })
  }
  if (item.itemDurability !== null) {
    coreStats.push({ label: "Durabilidade", value: `${item.itemDurability}` })
  }
  if (item.itemPreRequirement) {
    coreStats.push({ label: "Pre-Requisito", value: item.itemPreRequirement })
  }
  if (abilities.length > 0) {
    abilities.forEach((ability) => abilityEntries.push(ability))
  } else if (item.itemAbility || item.itemAbilityName) {
    abilityEntries.push({
      name: item.itemAbilityName ?? "sem nome",
      description: item.itemAbility ?? "-",
    })
  }
  if (effects.length > 0) {
    effects.forEach((effect) => effectEntries.push(effect))
  } else if (item.itemEffect || item.itemEffectName) {
    effectEntries.push({
      name: item.itemEffectName ?? "sem nome",
      description: item.itemEffect ?? "-",
    })
  }
  if (customFields.length > 0) {
    customFields.forEach((field) =>
      coreStats.push({ label: field.name, value: field.value || "-" }),
    )
  }

  return {
    id: item.id,
    title: item.itemName,
    imageUrl: item.itemImage ?? undefined,
    rarityLabel: rarityLabels[item.itemRarity],
    rarityClass: item.itemRarity,
    quantity: item.quantity,
    description: item.itemDescription ?? undefined,
    secondaryLine: itemTypeLabel[item.itemType as keyof typeof itemTypeLabel] ?? item.itemType,
    coreStats,
    abilityEntries,
    effectEntries,
  }
}
