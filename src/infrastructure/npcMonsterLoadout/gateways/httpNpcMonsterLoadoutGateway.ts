import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import type { CharacterInventoryDataDto, CharacterInventoryItemDto } from "@/application/characterInventory/types"
import type { NpcMonsterLoadoutGateway } from "@/application/npcMonsterLoadout/contracts/NpcMonsterLoadoutGateway"
import type {
  NpcMonsterAbilitiesDataDto,
  NpcMonsterLoadoutItemOptionDto,
  NpcMonsterLoadoutSkillOptionDto,
} from "@/application/npcMonsterLoadout/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

type SkillListResponse = {
  skills?: Array<{
    id?: string
    slug?: string
    tags?: string[]
  }>
}

export const httpNpcMonsterLoadoutGateway: NpcMonsterLoadoutGateway = {
  async fetchInventory(rpgId, characterId): Promise<CharacterInventoryDataDto> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/inventory`)
    const payload = await parseJson<{
      characterName?: string
      inventory?: CharacterInventoryItemDto[]
      useInventoryWeightLimit?: boolean
      maxCarryWeight?: number | null
    }>(response)

    return {
      characterName: payload.characterName ?? "Personagem",
      inventory: payload.inventory ?? [],
      useInventoryWeightLimit: Boolean(payload.useInventoryWeightLimit),
      maxCarryWeight: payload.maxCarryWeight ?? null,
    }
  },

  async listAvailableItems(rpgId): Promise<NpcMonsterLoadoutItemOptionDto[]> {
    const response = await fetch(`/api/rpg/${rpgId}/items`)
    const payload = await parseJson<{
      items?: Array<{
        id?: string
        name?: string
        image?: string | null
        type?: string
        rarity?: string
      }>
    }>(response)

    return (payload.items ?? [])
      .filter((item): item is { id: string; name: string; image?: string | null; type?: string; rarity?: string } =>
        typeof item.id === "string" && item.id.trim().length > 0 && typeof item.name === "string" && item.name.trim().length > 0,
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image ?? null,
        type: item.type ?? "",
        rarity: item.rarity ?? "",
      }))
  },

  async addInventoryItem(rpgId, characterId, params) {
    const response = await fetch(`/api/rpg/${rpgId}/items/give`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseItemId: params.baseItemId,
        quantity: params.quantity ?? 1,
        characterIds: [characterId],
      }),
    })
    await parseJson<{ message?: string }>(response)
    return { success: true }
  },

  async removeInventoryItem(rpgId, characterId, params) {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/inventory`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    const payload = await parseJson<{
      inventoryItemId?: string
      remainingQuantity?: number
    }>(response)

    return {
      inventoryItemId: payload.inventoryItemId ?? params.inventoryItemId,
      remainingQuantity: payload.remainingQuantity ?? 0,
    }
  },

  async fetchAbilities(rpgId, characterId): Promise<NpcMonsterAbilitiesDataDto> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/abilities`)
    const payload = await parseJson<{
      characterName?: string
      abilities?: PurchasedAbilityViewDto[]
    }>(response)

    return {
      characterName: payload.characterName ?? "Personagem",
      abilities: payload.abilities ?? [],
    }
  },

  async listAvailableSkills(rpgId): Promise<NpcMonsterLoadoutSkillOptionDto[]> {
    const response = await fetch(`/api/skills?rpgId=${encodeURIComponent(rpgId)}`)
    const payload = await parseJson<SkillListResponse>(response)

    return (payload.skills ?? [])
      .filter((skill): skill is { id: string; slug: string; tags?: string[] } =>
        typeof skill.id === "string" &&
        skill.id.trim().length > 0 &&
        typeof skill.slug === "string" &&
        skill.slug.trim().length > 0,
      )
      .map((skill) => ({
        id: skill.id,
        slug: skill.slug,
        tags: Array.isArray(skill.tags) ? skill.tags.filter((tag): tag is string => typeof tag === "string") : [],
      }))
  },

  async addAbility(rpgId, characterId, params) {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/abilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    const payload = await parseJson<{ success?: boolean; ability?: PurchasedAbilityViewDto }>(response)
    return {
      success: Boolean(payload.success),
      ability: payload.ability,
    }
  },

  async removeAbility(rpgId, characterId, params) {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/abilities`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    const payload = await parseJson<{ success?: boolean }>(response)
    return { success: Boolean(payload.success) }
  },
}
