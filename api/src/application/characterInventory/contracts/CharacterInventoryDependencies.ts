import type { CharacterInventoryGateway } from "@/application/characterInventory/contracts/CharacterInventoryGateway"

export type CharacterInventoryDependencies = {
  gateway: CharacterInventoryGateway
}
