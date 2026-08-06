import { AppError } from "@/features/shared/application/errors/AppError"
import { LibraryRepositoryError } from "@/features/world/library/application/errors/LibraryRepositoryError"
import type { ViewerCharacter } from "@/features/world/library/application/ports/LibraryRepository"

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

export function wrapLibraryError(
  error: unknown,
  fallbackMessage: string
): never {
  if (error instanceof AppError) throw error

  if (
    error instanceof LibraryRepositoryError &&
    error.code === "schema_outdated"
  ) {
    throw new AppError(
      "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes.",
      500
    )
  }

  throw new AppError(fallbackMessage, 500)
}

export function ensureCanViewRpg(exists: boolean, canView: boolean) {
  if (!exists || !canView) throw new AppError("RPG nao encontrado.", 404)
}

export function canViewLibrarySection(
  section: {
    createdByUserId?: string | null
    visibility: "private" | "public"
  },
  userId: string,
  canManage: boolean
) {
  return (
    canManage ||
    section.visibility === "public" ||
    section.createdByUserId === userId
  )
}

export function ensureCanViewLibrarySection(
  section: {
    createdByUserId?: string | null
    visibility: "private" | "public"
  },
  userId: string,
  canManage: boolean
) {
  if (!canViewLibrarySection(section, userId, canManage)) {
    throw new AppError("Secao nao encontrada.", 404)
  }
}

export function ensureCanManageOwnedResource(
  access: { exists: boolean; canManage: boolean },
  owner: { createdByUserId: string | null } | null,
  userId: string,
  resource: "Secao" | "Livro"
) {
  if (!access.exists) throw new AppError("RPG nao encontrado.", 404)
  if (!owner) throw new AppError(`${resource} nao encontrado.`, 404)
  if (access.canManage || owner.createdByUserId === userId) return

  throw new AppError(
    `Voce so pode editar ou remover ${resource === "Secao" ? "secoes" : "livros"} criados por voce.`,
    403
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
  options?: { allowUnlisted?: boolean }
) {
  if (canManage || book.createdByUserId === userId) return true
  if (book.visibility === "public") return true
  if (book.visibility === "unlisted") return Boolean(options?.allowUnlisted)

  const allowedUsersOrCharacterIds = new Set(
    parseStringList(book.allowedCharacterIds)
  )
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
      Boolean(character.raceKey && allowedRaceKeys.has(character.raceKey))
  )
}
