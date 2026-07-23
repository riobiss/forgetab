import type { CharacterInventoryGateway } from "@/features/world/character/application/inventory/contracts/CharacterInventoryGateway"

export type CharacterInventoryDependencies = {
  gateway: CharacterInventoryGateway
}
