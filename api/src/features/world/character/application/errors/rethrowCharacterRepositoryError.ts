import { AppError } from "@/features/shared/application/errors/AppError"
import { CharacterRepositoryError } from "@/features/world/character/application/errors/CharacterRepositoryError"

const messageByCode = {
  character_schema_missing:
    "Tabela de personagens nao existe no banco. Rode a migration.",
  character_schema_outdated:
    "Estrutura de personagens desatualizada. Rode a migration mais recente.",
  template_schema_missing:
    "Estrutura de racas/classes nao existe no banco. Rode a migration.",
  progression_schema_outdated:
    "Estrutura de progressao desatualizada. Rode a migration mais recente.",
  ability_schema_outdated:
    "Estrutura de habilidades desatualizada. Rode a migration mais recente.",
} as const

export function rethrowCharacterRepositoryError(error: unknown): never {
  if (error instanceof AppError) {
    throw error
  }

  if (
    error instanceof CharacterRepositoryError &&
    error.code !== "unknown"
  ) {
    throw new AppError(messageByCode[error.code], 500)
  }

  throw error
}
