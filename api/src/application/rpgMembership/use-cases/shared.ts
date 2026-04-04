import { AppError } from "@/shared/errors/AppError"

const MEMBERS_SCHEMA_PATTERNS = ['relation "rpg_members" does not exist'] as const
const CHARACTER_REQUESTS_SCHEMA_PATTERNS = [
  'relation "rpg_character_creation_requests" does not exist',
] as const

function isSchemaError(error: unknown, patterns: readonly string[]) {
  return error instanceof Error && patterns.some((pattern) => error.message.includes(pattern))
}

export function wrapMembersError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, MEMBERS_SCHEMA_PATTERNS)) {
    throw new AppError("Tabela de membros nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapCharacterRequestsError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (isSchemaError(error, CHARACTER_REQUESTS_SCHEMA_PATTERNS)) {
    throw new AppError(
      "Tabela de solicitacoes de criacao de personagem nao existe no banco. Rode a migration.",
      500,
    )
  }
  if (isSchemaError(error, MEMBERS_SCHEMA_PATTERNS)) {
    throw new AppError("Tabela de membros nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

