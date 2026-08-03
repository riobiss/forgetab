import { AppError } from "@/features/shared/application/errors/AppError"
import {
  RpgConfigRepositoryError,
  type RpgConfigRepositoryErrorCode,
} from "@/features/world/application/config/errors/RpgConfigRepositoryError"

export function assertCanReadRpg(exists: boolean) {
  if (!exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
}

export function assertCanManageRpg(exists: boolean) {
  if (!exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
}

function hasRepositoryCode(
  error: unknown,
  ...codes: RpgConfigRepositoryErrorCode[]
) {
  return error instanceof RpgConfigRepositoryError && codes.includes(error.code)
}

export function wrapAttributeError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (hasRepositoryCode(error, "attribute_schema_missing")) {
    throw new AppError("Tabela de templates de atributos nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapStatusError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (hasRepositoryCode(error, "status_schema_missing")) {
    throw new AppError("Tabela de templates de status nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapSkillError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (hasRepositoryCode(error, "skill_schema_missing")) {
    throw new AppError("Tabela de templates de pericias nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapRaceError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (hasRepositoryCode(error, "race_schema_missing")) {
    throw new AppError("Tabela de racas nao existe no banco. Rode a migration.", 500)
  }
  if (
    hasRepositoryCode(
      error,
      "attribute_schema_missing",
      "skill_schema_missing",
    )
  ) {
    throw new AppError("Estrutura de templates indisponivel. Rode as migrations mais recentes.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapClassError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (hasRepositoryCode(error, "class_schema_missing")) {
    throw new AppError("Tabela de classes nao existe no banco. Rode a migration.", 500)
  }
  if (
    hasRepositoryCode(
      error,
      "attribute_schema_missing",
      "skill_schema_missing",
    )
  ) {
    throw new AppError("Estrutura de templates indisponivel. Rode as migrations mais recentes.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapIdentityError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (hasRepositoryCode(error, "identity_schema_missing")) {
    throw new AppError("Tabela de identidade de personagem nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapCharacteristicError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (hasRepositoryCode(error, "characteristic_schema_missing")) {
    throw new AppError(
      "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration.",
      500,
    )
  }
  throw new AppError(fallbackMessage, 500)
}
