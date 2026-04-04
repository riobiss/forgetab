import {
  prismaCharacterRepository,
  type CharacterRepository,
} from "./repositories/characterRepository"
import type { ListCharactersResult, RpgAccess } from "./types"

export class ListCharactersError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "ListCharactersError"
  }
}

type ListCharactersInput = {
  rpgId: string
  userId: string
  access: RpgAccess
  characterRepository?: CharacterRepository
}

function fail(status: number, message: string): never {
  throw new ListCharactersError(status, message)
}

export async function listCharacters(input: ListCharactersInput): Promise<ListCharactersResult> {
  const {
    rpgId,
    userId,
    access,
    characterRepository = prismaCharacterRepository,
  } = input

  try {
    const characters = await characterRepository.listByRpg({
      rpgId,
      userId,
      isOwner: access.isOwner,
    })

    return {
      characters,
      isOwner: access.isOwner,
      useRaceBonuses: access.useRaceBonuses,
      useClassBonuses: access.useClassBonuses,
      useInventoryWeightLimit: access.useInventoryWeightLimit,
      allowMultiplePlayerCharacters: access.allowMultiplePlayerCharacters,
      progressionMode: access.progressionMode,
      progressionTiers: access.progressionTiers,
    }
  } catch (error) {
    if (error instanceof ListCharactersError) {
      throw error
    }
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
    }
    if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_label" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_required" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_current" of relation "rpg_characters" does not exist'))
    ) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }

    throw error
  }
}
