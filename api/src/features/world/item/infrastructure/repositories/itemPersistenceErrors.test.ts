import { describe, expect, it } from "vitest"
import { withItemPersistenceErrors } from "./itemPersistenceErrors"

describe("withItemPersistenceErrors", () => {
  it.each([
    ['relation "baseitems" does not exist', "schema_outdated"],
    [
      'relation "rpg_character_inventory_items" does not exist',
      "inventory_schema_missing",
    ],
    ["connection terminated unexpectedly", "unknown"],
  ] as const)("traduz erro de persistencia sem vazar SQL", async (message, code) => {
    const cause = new Error(message)

    await expect(
      withItemPersistenceErrors(async () => {
        throw cause
      }),
    ).rejects.toMatchObject({
      name: "ItemRepositoryError",
      code,
      cause,
    })
  })
})
