import type { CharacterRepository } from "@/application/characters/ports/CharacterRepository"
import type { ListCharactersResult, RpgAccess } from "@/application/characters/types"
import { AppError } from "@/shared/errors/AppError"

type ListCharactersInput = {
  rpgId: string
  userId: string
  access: RpgAccess
  characterRepository: CharacterRepository
}

export async function listCharacters(input: ListCharactersInput): Promise<ListCharactersResult> {
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
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      throw new AppError("Tabela de personagens nao existe no banco. Rode a migration.", 500)
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "skills" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "image" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_mode" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_label" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_required" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_current" of relation "rpg_characters" does not exist'))
    ) {
      throw new AppError("Estrutura de personagens desatualizada. Rode a migration mais recente.", 500)
    }

    throw error
  }
}
