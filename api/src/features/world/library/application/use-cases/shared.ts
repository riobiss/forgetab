import { AppError } from "@/features/shared/application/errors/AppError"
import type { ViewerCharacter } from "@/features/world/library/application/ports/LibraryRepository"

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

export function ensureCanViewRpg(exists: boolean, canView: boolean) {
  if (!exists || !canView) throw new AppError("RPG nao encontrado.", 404)
}

export function canViewLibrarySection(
  section: { createdByUserId?: string | null; visibility: "private" | "public" },
  userId: string,
  canManage: boolean,
) {
  return (
    canManage ||
    section.visibility === "public" ||
    section.createdByUserId === userId
  )
}

export function ensureCanViewLibrarySection(
  section: { createdByUserId?: string | null; visibility: "private" | "public" },
  userId: string,
  canManage: boolean,
) {
  if (!canViewLibrarySection(section, userId, canManage)) {
    throw new AppError("Secao nao encontrada.", 404)
  }
}

export function ensureCanManageOwnedResource(
  access: { exists: boolean; canManage: boolean },
  owner: { createdByUserId: string | null } | null,
  userId: string,
  resource: "Secao" | "Livro",
) {
  if (!access.exists) throw new AppError("RPG nao encontrado.", 404)
  if (!owner) throw new AppError(`${resource} nao encontrado.`, 404)
  if (access.canManage || owner.createdByUserId === userId) return

  throw new AppError(
    `Voce so pode editar ou remover ${resource === "Secao" ? "secoes" : "livros"} criados por voce.`,
    403,
  )
}

export function canViewLibraryBook(
  book: {
    createdByUserId?: string | null
    visibility: "private" | "public" | "unlisted"
    allowedCharacterIds: string[]
    allowedClassKeys: string[]
    allowedRaceKeys: string[]
  },
  userId: string,
  canManage: boolean,
  viewerCharacters: ViewerCharacter[],
  options?: { allowUnlisted?: boolean },
) {
  if (canManage || book.createdByUserId === userId) return true
  if (book.visibility === "public") return true
  if (book.visibility === "unlisted") return Boolean(options?.allowUnlisted)

  const allowedUsersOrCharacterIds = new Set(parseStringList(book.allowedCharacterIds))
  const allowedClassKeys = new Set(parseStringList(book.allowedClassKeys))
  const allowedRaceKeys = new Set(parseStringList(book.allowedRaceKeys))

  if (
    allowedUsersOrCharacterIds.size === 0 &&
    allowedClassKeys.size === 0 &&
    allowedRaceKeys.size === 0
  ) {
    return false
  }

  if (allowedUsersOrCharacterIds.has(userId)) return true

  return viewerCharacters.some(
    (character) =>
      allowedUsersOrCharacterIds.has(character.id) ||
      Boolean(character.classKey && allowedClassKeys.has(character.classKey)) ||
      Boolean(character.raceKey && allowedRaceKeys.has(character.raceKey)),
  )
}
