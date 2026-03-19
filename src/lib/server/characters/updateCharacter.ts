import { legacyCharacterManagementService } from "@/infrastructure/characters/services/legacyCharacterManagementService"
import { AppError } from "@/shared/errors/AppError"

export type UpdateCharacterPayload = {
  name?: string
  image?: string
  maxCarryWeight?: number | null
  statuses?: Record<string, number>
  attributes?: Record<string, number>
  skills?: Record<string, number>
  identity?: Record<string, string>
  characteristics?: Record<string, string>
  visibility?: "private" | "public"
  raceKey?: string
  classKey?: string
  progressionCurrent?: number
}

type UpdateCharacterInput = {
  rpgId: string
  characterId: string
  userId: string
  payload: UpdateCharacterPayload
}

export class UpdateCharacterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "UpdateCharacterError"
  }
}

function fail(status: number, message: string): never {
  throw new UpdateCharacterError(status, message)
}

export async function updateCharacter(input: UpdateCharacterInput): Promise<void> {
  try {
    await legacyCharacterManagementService.updateCharacter(input)
  } catch (error) {
    if (error instanceof AppError) fail(error.status, error.message)
    throw error
  }
}
