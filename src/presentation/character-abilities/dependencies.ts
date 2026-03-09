import type { CharacterAbilitiesDependencies } from "@/application/characterAbilities/contracts/CharacterAbilitiesDependencies"
import { httpCharacterAbilitiesGateway } from "@/infrastructure/characterAbilities/gateways/httpCharacterAbilitiesGateway"

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
