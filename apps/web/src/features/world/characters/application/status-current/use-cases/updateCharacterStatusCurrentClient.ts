import type {
  CharacterStatusCurrentDependencies,
  UpdateCharacterStatusCurrentInput,
} from "@/features/world/characters/application/status-current/contracts/CharacterStatusCurrentGateway"

export function updateCharacterStatusCurrentClientUseCase(
  dependencies: CharacterStatusCurrentDependencies,
  input: UpdateCharacterStatusCurrentInput,
) {
  return dependencies.gateway.update(input)
}
