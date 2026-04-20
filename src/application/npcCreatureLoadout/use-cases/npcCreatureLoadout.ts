import type { NpcCreatureLoadoutDependencies } from "@/application/npcCreatureLoadout/contracts/NpcCreatureLoadoutDependencies"

type Dependencies = NpcCreatureLoadoutDependencies

export async function loadNpcCreatureInventoryUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string },
) {
  return deps.gateway.fetchInventory(params.rpgId, params.characterId)
}

export async function listNpcCreatureItemOptionsUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.listAvailableItems(params.rpgId)
}

export async function addNpcCreatureInventoryItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; baseItemId: string; quantity?: number },
) {
  return deps.gateway.addInventoryItem(params.rpgId, params.characterId, {
    baseItemId: params.baseItemId,
    quantity: params.quantity,
  })
}

export async function removeNpcCreatureInventoryItemUseCase(
  deps: Dependencies,
  params: {
    rpgId: string
    characterId: string
    inventoryItemId: string
    quantity: number
  },
) {
  return deps.gateway.removeInventoryItem(params.rpgId, params.characterId, {
    inventoryItemId: params.inventoryItemId,
    quantity: params.quantity,
  })
}

export async function loadNpcCreatureAbilitiesUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string },
) {
  return deps.gateway.fetchAbilities(params.rpgId, params.characterId)
}

export async function listNpcCreatureSkillOptionsUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.listAvailableSkills(params.rpgId)
}

export async function addNpcCreatureAbilityUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; skillId: string; level?: number },
) {
  return deps.gateway.addAbility(params.rpgId, params.characterId, {
    skillId: params.skillId,
    level: params.level,
  })
}

export async function removeNpcCreatureAbilityUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; skillId: string; level: number },
) {
  return deps.gateway.removeAbility(params.rpgId, params.characterId, {
    skillId: params.skillId,
    level: params.level,
  })
}
