import { createCharacter as createCharacterUseCase } from "@/features/world/character/application/use-cases/createCharacter"
import type { CharacterRepository as ApplicationCharacterRepository } from "@/features/world/character/application/ports/CharacterRepository"
import type { RpgTemplatesRepository as ApplicationRpgTemplatesRepository } from "@/features/world/character/application/ports/RpgTemplatesRepository"
import { AppError } from "@/features/shared/infrastructure/errors/AppError"
import type { CharacterRow, CreateCharacterPayload, RpgAccess } from "./types"
import {
  prismaCharacterRepository,
  type CharacterRepository,
} from "./repositories/characterRepository"
import {
  prismaRpgTemplatesRepository,
  type RpgTemplatesRepository,
} from "./repositories/rpgTemplatesRepository"

export class CreateCharacterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "CreateCharacterError"
  }
}

type CreateCharacterInput = {
  rpgId: string
  userId: string
  access: RpgAccess
  payload: CreateCharacterPayload
  characterRepository?: CharacterRepository
  rpgTemplatesRepository?: RpgTemplatesRepository
}

function toLegacyCreateCharacterError(error: AppError) {
  return new CreateCharacterError(error.status, error.message)
}

export async function createCharacter(
  input: CreateCharacterInput,
): Promise<CharacterRow> {
  const {
    rpgId,
    userId,
    access,
    payload,
    characterRepository = prismaCharacterRepository,
    rpgTemplatesRepository = prismaRpgTemplatesRepository,
  } = input

  try {
    return await createCharacterUseCase({
      rpgId,
      userId,
      access,
      payload,
      characterRepository:
        characterRepository as ApplicationCharacterRepository,
      rpgTemplatesRepository:
        rpgTemplatesRepository as ApplicationRpgTemplatesRepository,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw toLegacyCreateCharacterError(error)
    }

    throw error
  }
}
