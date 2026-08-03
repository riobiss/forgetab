import { RpgConfigRepositoryError } from "@/features/world/application/config/errors/RpgConfigRepositoryError"
import type { RpgConfigRepository } from "@/features/world/application/config/ports/RpgConfigRepository"

const schemaErrors = [
  ["attribute_schema_missing", ['relation "rpg_attribute_templates" does not exist']],
  ["status_schema_missing", ['relation "rpg_status_templates" does not exist']],
  ["skill_schema_missing", ['relation "rpg_skill_templates" does not exist']],
  [
    "race_schema_missing",
    [
      'relation "rpg_race_templates" does not exist',
      'column "lore" of relation "rpg_race_templates" does not exist',
    ],
  ],
  ["class_schema_missing", ['relation "rpg_class_templates" does not exist']],
  [
    "identity_schema_missing",
    ['relation "rpg_character_identity_templates" does not exist'],
  ],
  [
    "characteristic_schema_missing",
    ['relation "rpg_character_characteristic_templates" does not exist'],
  ],
] as const

export function toRpgConfigRepositoryError(error: unknown) {
  if (error instanceof RpgConfigRepositoryError) return error

  const message = error instanceof Error ? error.message : ""
  const match = schemaErrors.find(([, patterns]) =>
    patterns.some((pattern) => message.includes(pattern)),
  )

  return new RpgConfigRepositoryError(match?.[0] ?? "unknown", {
    cause: error,
  })
}

async function withRpgConfigPersistenceErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw toRpgConfigRepositoryError(error)
  }
}

export function withRpgConfigRepositoryErrors(
  repository: RpgConfigRepository,
): RpgConfigRepository {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (typeof value !== "function") return value

      return (...args: unknown[]) =>
        withRpgConfigPersistenceErrors(() =>
          Reflect.apply(value, target, args) as Promise<unknown>,
        )
    },
  })
}
