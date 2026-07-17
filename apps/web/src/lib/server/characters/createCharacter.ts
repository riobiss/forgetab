import {
  createCharacter as createCharacterUseCase,
} from "@/features/world/characters/application/characters/use-cases/createCharacter"
import type { CharacterRepository as ApplicationCharacterRepository } from "@/features/world/characters/application/characters/ports/CharacterRepository"
import type { RpgTemplatesRepository as ApplicationRpgTemplatesRepository } from "@/features/world/characters/application/characters/ports/RpgTemplatesRepository"
import { AppError } from "@/shared/errors/AppError"
import type {
  CharacterRow,
  CreateCharacterPayload,
  RpgAccess,
} from "./types"
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

export async function createCharacter(input: CreateCharacterInput): Promise<CharacterRow> {
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
      characterRepository: characterRepository as ApplicationCharacterRepository,
      rpgTemplatesRepository: rpgTemplatesRepository as ApplicationRpgTemplatesRepository,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw toLegacyCreateCharacterError(error)
    }

    throw error
  }
}
