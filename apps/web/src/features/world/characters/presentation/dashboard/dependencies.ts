import type { CharacterAbilitiesDependencies } from "@/features/world/characters/application/abilities/contracts/CharacterAbilitiesDependencies"
import { createHttpNpcMonsterCharacterAbilitiesGateway } from "@/features/world/characters/infrastructure/abilities/gateways/httpNpcMonsterCharacterAbilitiesGateway"
import type { NpcMonsterLoadoutDependencies } from "@/features/world/characters/application/loadout/contracts/NpcMonsterLoadoutDependencies"
import { httpNpcMonsterLoadoutGateway } from "@/features/world/characters/infrastructure/loadout/gateways/httpNpcMonsterLoadoutGateway"

export type CharacterDetailModalDependencies = {
  loadout: NpcMonsterLoadoutDependencies
  createAbilities(rpgId: string): CharacterAbilitiesDependencies
}

export const npcMonsterLoadoutDependencies: NpcMonsterLoadoutDependencies = {
  gateway: httpNpcMonsterLoadoutGateway,
}

export function createCharacterDetailModalDependencies(): CharacterDetailModalDependencies {
  return {
    loadout: npcMonsterLoadoutDependencies,
    createAbilities: (rpgId) => ({
      gateway: createHttpNpcMonsterCharacterAbilitiesGateway(rpgId),
    }),
  }
}
