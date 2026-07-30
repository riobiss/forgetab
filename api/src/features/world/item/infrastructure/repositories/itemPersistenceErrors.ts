import { ItemRepositoryError } from "@/features/world/item/application/errors/ItemRepositoryError"

const itemSchemaErrorFragments = [
  'relation "baseitems" does not exist',
  'column "effect_name" does not exist',
  'column "description" does not exist',
  'column "pre_requirement" does not exist',
  'column "duration" does not exist',
  'column "range" does not exist',
  'column "image" does not exist',
  'column "custom_fields" does not exist',
]

function toItemRepositoryError(error: unknown) {
  if (error instanceof ItemRepositoryError) {
    return error
  }

  const message = error instanceof Error ? error.message : ""
  if (
    message.includes('relation "rpg_character_inventory_items" does not exist')
  ) {
    return new ItemRepositoryError("inventory_schema_missing", {
      cause: error,
    })
  }

  if (itemSchemaErrorFragments.some((fragment) => message.includes(fragment))) {
    return new ItemRepositoryError("schema_outdated", { cause: error })
  }

  return new ItemRepositoryError("unknown", { cause: error })
}

export async function withItemPersistenceErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw toItemRepositoryError(error)
  }
}
