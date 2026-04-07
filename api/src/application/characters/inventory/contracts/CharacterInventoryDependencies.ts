import type { CharacterInventoryGateway } from "@/application/characters/inventory/contracts/CharacterInventoryGateway"

export type CharacterInventoryDependencies = {
  gateway: CharacterInventoryGateway
}
