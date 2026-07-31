import type { CharacterRepository } from "@/features/world/character/application/ports/CharacterRepository"
import type {
  ListCharactersResult,
  RpgAccess,
} from "@/features/world/character/application/types"
import { rethrowCharacterRepositoryError } from "@/features/world/character/application/errors/rethrowCharacterRepositoryError"

type ListCharactersInput = {
  rpgId: string
  userId: string
  access: RpgAccess
  characterRepository: CharacterRepository
}

export async function listCharacters(
  input: ListCharactersInput,
): Promise<ListCharactersResult> {
  try {
    const characters = await input.characterRepository.listByRpg({
      rpgId: input.rpgId,
      userId: input.userId,
      isOwner: input.access.isOwner,
    })

    return {
      characters,
      isOwner: input.access.isOwner,
      useRaceBonuses: input.access.useRaceBonuses,
      useClassBonuses: input.access.useClassBonuses,
      useInventoryWeightLimit: input.access.useInventoryWeightLimit,
      allowMultiplePlayerCharacters: input.access.allowMultiplePlayerCharacters,
      progressionMode: input.access.progressionMode,
      progressionTiers: input.access.progressionTiers,
    }
  } catch (error) {
    rethrowCharacterRepositoryError(error)
  }
}
