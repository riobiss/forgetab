import { RpgMembershipRepositoryError } from "@/features/world/application/membership/errors/RpgMembershipRepositoryError"
import type { RpgMembershipRepository } from "@/features/world/application/membership/ports/RpgMembershipRepository"

export function toRpgMembershipRepositoryError(error: unknown) {
  if (error instanceof RpgMembershipRepositoryError) return error

  const message = error instanceof Error ? error.message : ""
  const code = message.includes('relation "rpg_members" does not exist')
    ? "members_schema_missing"
    : message.includes(
          'relation "rpg_character_creation_requests" does not exist',
        )
      ? "character_requests_schema_missing"
      : "unknown"

  return new RpgMembershipRepositoryError(code, { cause: error })
}

async function withRpgMembershipPersistenceErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw toRpgMembershipRepositoryError(error)
  }
}

export function withRpgMembershipRepositoryErrors(
  repository: RpgMembershipRepository,
): RpgMembershipRepository {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (typeof value !== "function") return value

      return (...args: unknown[]) =>
        withRpgMembershipPersistenceErrors(() =>
          Reflect.apply(value, target, args) as Promise<unknown>,
        )
    },
  })
}
