import type { CharacterInventoryGateway } from "@/features/world/characters/application/inventory/contracts/CharacterInventoryGateway"

export type CharacterInventoryDependencies = {
  gateway: CharacterInventoryGateway
}
