import { CharacterRepositoryError } from "@/features/world/character/application/errors/CharacterRepositoryError"

const characterSchemaColumns = [
  "created_by_user_id",
  "visibility",
  "skills",
  "image",
  "race_key",
  "class_key",
  "max_carry_weight",
  "current_statuses",
  "identity",
  "characteristics",
  "skill_points",
]

const progressionSchemaColumns = [
  "progression_mode",
  "progression_tiers",
  "progression_current",
  "progression_label",
  "progression_required",
]

function includesMissingColumn(message: string, columns: string[]) {
  return (
    message.includes("does not exist") &&
    columns.some((column) => message.includes(`column "${column}"`))
  )
}

export function toCharacterRepositoryError(error: unknown) {
  if (error instanceof CharacterRepositoryError) {
    return error
  }

  const message = error instanceof Error ? error.message : ""

  if (
    message.includes('relation "rpg_race_templates" does not exist') ||
    message.includes('relation "rpg_class_templates" does not exist')
  ) {
    return new CharacterRepositoryError("template_schema_missing", {
      cause: error,
    })
  }

  if (
    message.includes('relation "skills" does not exist') ||
    message.includes('relation "skill_levels" does not exist') ||
    message.includes('relation "skill_class_links" does not exist')
  ) {
    return new CharacterRepositoryError("ability_schema_outdated", {
      cause: error,
    })
  }

  if (includesMissingColumn(message, progressionSchemaColumns)) {
    return new CharacterRepositoryError("progression_schema_outdated", {
      cause: error,
    })
  }

  if (includesMissingColumn(message, characterSchemaColumns)) {
    return new CharacterRepositoryError("character_schema_outdated", {
      cause: error,
    })
  }

  if (message.includes('relation "rpg_characters" does not exist')) {
    return new CharacterRepositoryError("character_schema_missing", {
      cause: error,
    })
  }

  return new CharacterRepositoryError("unknown", { cause: error })
}

export async function withCharacterPersistenceErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw toCharacterRepositoryError(error)
  }
}
