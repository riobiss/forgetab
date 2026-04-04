import type { NpcMonsterLoadoutDependencies } from "@/application/npcMonsterLoadout/contracts/NpcMonsterLoadoutDependencies"

type Dependencies = NpcMonsterLoadoutDependencies

export async function loadNpcMonsterInventoryUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string },
) {
  return deps.gateway.fetchInventory(params.rpgId, params.characterId)
}

export async function listNpcMonsterItemOptionsUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.listAvailableItems(params.rpgId)
}

export async function addNpcMonsterInventoryItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; baseItemId: string; quantity?: number },
) {
  return deps.gateway.addInventoryItem(params.rpgId, params.characterId, {
    baseItemId: params.baseItemId,
    quantity: params.quantity,
  })
}

export async function removeNpcMonsterInventoryItemUseCase(
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

export async function loadNpcMonsterAbilitiesUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string },
) {
  return deps.gateway.fetchAbilities(params.rpgId, params.characterId)
}

export async function listNpcMonsterSkillOptionsUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.listAvailableSkills(params.rpgId)
}

export async function addNpcMonsterAbilityUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; skillId: string; level?: number },
) {
  return deps.gateway.addAbility(params.rpgId, params.characterId, {
    skillId: params.skillId,
    level: params.level,
  })
}

export async function removeNpcMonsterAbilityUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; skillId: string; level: number },
) {
  return deps.gateway.removeAbility(params.rpgId, params.characterId, {
    skillId: params.skillId,
    level: params.level,
  })
}
