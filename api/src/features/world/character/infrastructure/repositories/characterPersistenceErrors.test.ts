import { describe, expect, it } from "vitest"
import { toCharacterRepositoryError } from "@/features/world/character/infrastructure/repositories/characterPersistenceErrors"

describe("characterPersistenceErrors", () => {
  it.each([
    ['relation "rpg_characters" does not exist', "character_schema_missing"],
    ['column "skills" of relation "rpg_characters" does not exist', "character_schema_outdated"],
    ['relation "rpg_race_templates" does not exist', "template_schema_missing"],
    ['column "progression_current" does not exist', "progression_schema_outdated"],
    ['relation "skill_levels" does not exist', "ability_schema_outdated"],
  ] as const)("maps %s to %s", (message, code) => {
    expect(toCharacterRepositoryError(new Error(message))).toMatchObject({
      name: "CharacterRepositoryError",
      code,
    })
  })

  it("preserves the original error as cause for unknown failures", () => {
    const cause = new Error("connection closed")
    const error = toCharacterRepositoryError(cause)

    expect(error).toMatchObject({
      code: "unknown",
      cause,
    })
  })
})
