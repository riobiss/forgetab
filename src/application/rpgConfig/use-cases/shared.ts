import { AppError } from "@/shared/errors/AppError"

const STATUS_SCHEMA_ERRORS = ['relation "rpg_status_templates" does not exist'] as const
const ATTRIBUTE_SCHEMA_ERRORS = ['relation "rpg_attribute_templates" does not exist'] as const
const CLASS_SCHEMA_ERRORS = ['relation "rpg_class_templates" does not exist'] as const
const RACE_SCHEMA_ERRORS = [
  'relation "rpg_race_templates" does not exist',
  'column "lore" of relation "rpg_race_templates" does not exist',
] as const
const IDENTITY_SCHEMA_ERRORS = ['relation "rpg_character_identity_templates" does not exist'] as const
const CHARACTERISTIC_SCHEMA_ERRORS = [
  'relation "rpg_character_characteristic_templates" does not exist',
] as const
const SKILL_SCHEMA_ERRORS = ['relation "rpg_skill_templates" does not exist'] as const

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

export function isSchemaError(error: unknown, patterns: readonly string[]) {
  if (!(error instanceof Error)) return false
  return patterns.some((pattern) => error.message.includes(pattern))
}

export function wrapAttributeError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, ATTRIBUTE_SCHEMA_ERRORS)) {
    throw new AppError("Tabela de templates de atributos nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapStatusError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, STATUS_SCHEMA_ERRORS)) {
    throw new AppError("Tabela de templates de status nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapRaceError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, RACE_SCHEMA_ERRORS)) {
    throw new AppError("Tabela de racas nao existe no banco. Rode a migration.", 500)
  }
  if (isSchemaError(error, ATTRIBUTE_SCHEMA_ERRORS) || isSchemaError(error, SKILL_SCHEMA_ERRORS)) {
    throw new AppError("Estrutura de templates indisponivel. Rode as migrations mais recentes.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapClassError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, CLASS_SCHEMA_ERRORS)) {
    throw new AppError("Tabela de classes nao existe no banco. Rode a migration.", 500)
  }
  if (isSchemaError(error, ATTRIBUTE_SCHEMA_ERRORS) || isSchemaError(error, SKILL_SCHEMA_ERRORS)) {
    throw new AppError("Estrutura de templates indisponivel. Rode as migrations mais recentes.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapIdentityError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, IDENTITY_SCHEMA_ERRORS)) {
    throw new AppError("Tabela de identidade de personagem nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapCharacteristicError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, CHARACTERISTIC_SCHEMA_ERRORS)) {
    throw new AppError(
      "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration.",
      500,
    )
  }
  throw new AppError(fallbackMessage, 500)
}

