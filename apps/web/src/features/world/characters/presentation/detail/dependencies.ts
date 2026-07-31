import type { CharacterStatusCurrentDependencies } from "@/features/world/characters/application/status-current/contracts/CharacterStatusCurrentGateway"
import { httpCharacterStatusCurrentGateway } from "@/features/world/characters/infrastructure/status-current/gateways/httpCharacterStatusCurrentGateway"

export function createCharacterStatusCurrentDependencies(): CharacterStatusCurrentDependencies {
  return { gateway: httpCharacterStatusCurrentGateway }
}
