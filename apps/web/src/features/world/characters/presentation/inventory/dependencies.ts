import type { CharacterInventoryDependencies } from "@/features/world/characters/application/inventory/contracts/CharacterInventoryDependencies"
import { httpCharacterInventoryGateway } from "@/features/world/characters/infrastructure/inventory/gateways/httpCharacterInventoryGateway"

export type CharacterInventoryGatewayFactory = "http"

export function createCharacterInventoryDependencies(
  factory: CharacterInventoryGatewayFactory = "http",
): CharacterInventoryDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpCharacterInventoryGateway }
  }
}
