import { characterManagementService } from "@/infrastructure/characters/services/characterManagementService"
import { AppError } from "@/shared/errors/AppError"

type DeleteCharacterInput = {
  rpgId: string
  characterId: string
  userId: string
}

export class DeleteCharacterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "DeleteCharacterError"
  }
}

function fail(status: number, message: string): never {
  throw new DeleteCharacterError(status, message)
}

export async function deleteCharacter(input: DeleteCharacterInput): Promise<void> {
  try {
    await characterManagementService.deleteCharacter(input)
  } catch (error) {
    if (error instanceof AppError) fail(error.status, error.message)
    throw error
  }
}
