import { LibraryRepositoryError } from "@/features/world/library/application/errors/LibraryRepositoryError"
import type { LibraryRepository } from "@/features/world/library/application/ports/LibraryRepository"

const schemaErrorPatterns = [
  'relation "rpg_library_sections" does not exist',
  'relation "rpg_library_books" does not exist',
  'column "created_by_user_id" does not exist',
  'column "description" does not exist',
  'column "visibility" does not exist',
  'column "allowed_character_ids" does not exist',
  'column "allowed_class_keys" does not exist',
  'column "allowed_race_keys" does not exist'
] as const

export function toLibraryRepositoryError(error: unknown) {
  if (error instanceof LibraryRepositoryError) return error

  const message = error instanceof Error ? error.message : ""
  const code = schemaErrorPatterns.some((pattern) => message.includes(pattern))
    ? "schema_outdated"
    : "unknown"

  return new LibraryRepositoryError(code, { cause: error })
}

async function withLibraryPersistenceErrors<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw toLibraryRepositoryError(error)
  }
}

export function withLibraryRepositoryErrors(
  repository: LibraryRepository
): LibraryRepository {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (typeof value !== "function") return value

      return (...args: unknown[]) =>
        withLibraryPersistenceErrors(
          () => Reflect.apply(value, target, args) as Promise<unknown>
        )
    }
  })
}
