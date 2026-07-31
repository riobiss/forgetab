import type { CharacterAbilitiesDependencies } from "@/features/world/characters/application/abilities/contracts/CharacterAbilitiesDependencies"
import { createHttpNpcMonsterCharacterAbilitiesGateway } from "@/features/world/characters/infrastructure/abilities/gateways/httpNpcMonsterCharacterAbilitiesGateway"
import type { NpcMonsterLoadoutDependencies } from "@/features/world/npc-monster-loadout/application/contracts/NpcMonsterLoadoutDependencies"
import { createNpcMonsterLoadoutDependencies } from "@/features/world/npc-monster-loadout/presentation/dependencies"

export type CharacterDetailModalDependencies = {
  loadout: NpcMonsterLoadoutDependencies
  createAbilities(rpgId: string): CharacterAbilitiesDependencies
}

export type CharacterDetailModalGatewayFactory = "http"

export function createCharacterDetailModalDependencies(
  factory: CharacterDetailModalGatewayFactory = "http",
): CharacterDetailModalDependencies {
  switch (factory) {
    case "http":
    default:
      return {
        loadout: createNpcMonsterLoadoutDependencies("http"),
        createAbilities: (rpgId) => ({
          gateway: createHttpNpcMonsterCharacterAbilitiesGateway(rpgId),
        }),
      }
  }
}
