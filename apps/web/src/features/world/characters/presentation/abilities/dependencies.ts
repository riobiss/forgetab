import type { CharacterAbilitiesDependencies } from "@/features/world/characters/application/abilities/contracts/CharacterAbilitiesDependencies"
import { httpCharacterAbilitiesGateway } from "@/features/world/characters/infrastructure/abilities/gateways/httpCharacterAbilitiesGateway"

export type CharacterAbilitiesGatewayFactory = "http"

export function createCharacterAbilitiesDependencies(
  factory: CharacterAbilitiesGatewayFactory = "http",
): CharacterAbilitiesDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpCharacterAbilitiesGateway }
  }
}
