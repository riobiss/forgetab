import type { CharacterInventoryDependencies } from "@/application/characterInventory/contracts/CharacterInventoryDependencies"
import { httpCharacterInventoryGateway } from "@/infrastructure/characterInventory/gateways/httpCharacterInventoryGateway"

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
