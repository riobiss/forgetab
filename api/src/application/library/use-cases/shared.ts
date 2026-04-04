import { AppError } from "@/shared/errors/AppError"

const LIBRARY_SCHEMA_ERROR_PATTERNS = [
  'relation "rpg_library_sections" does not exist',
  'relation "rpg_library_books" does not exist',
  'column "created_by_user_id" does not exist',
  'column "description" does not exist',
  'column "visibility" does not exist',
  'column "allowed_character_ids" does not exist',
  'column "allowed_class_keys" does not exist',
  'column "allowed_race_keys" does not exist',
] as const

export function normalizeDescription(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeTextList(input: string[]) {
  return input.map((value) => value.trim()).filter((value) => value.length > 0)
}

export function parseStringList(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function isLibrarySchemaError(error: unknown) {
  if (!(error instanceof Error)) return false
  return LIBRARY_SCHEMA_ERROR_PATTERNS.some((pattern) => error.message.includes(pattern))
}

export function wrapLibraryError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error

  if (isLibrarySchemaError(error)) {
    throw new AppError(
      "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes.",
      500,
    )
  }

  throw new AppError(fallbackMessage, 500)
}
