import { describe, expect, it } from "vitest"

import { RpgConfigRepositoryError } from "@/features/world/application/config/errors/RpgConfigRepositoryError"

import { toRpgConfigRepositoryError } from "./rpgConfigPersistenceErrors"

describe("toRpgConfigRepositoryError", () => {
  it.each([
    ['relation "rpg_attribute_templates" does not exist', "attribute_schema_missing"],
    ['relation "rpg_status_templates" does not exist', "status_schema_missing"],
    ['relation "rpg_skill_templates" does not exist', "skill_schema_missing"],
    ['column "lore" of relation "rpg_race_templates" does not exist', "race_schema_missing"],
    ['relation "rpg_class_templates" does not exist', "class_schema_missing"],
    ['relation "rpg_character_identity_templates" does not exist', "identity_schema_missing"],
    ['relation "rpg_character_characteristic_templates" does not exist', "characteristic_schema_missing"],
  ] as const)("traduz %s para %s", (message, code) => {
    const source = new Error(message)
    const result = toRpgConfigRepositoryError(source)

    expect(result).toBeInstanceOf(RpgConfigRepositoryError)
    expect(result.code).toBe(code)
    expect(result.cause).toBe(source)
  })

  it("preserva erros de repositorio ja tipados", () => {
    const source = new RpgConfigRepositoryError("unknown")

    expect(toRpgConfigRepositoryError(source)).toBe(source)
  })

  it("classifica falhas inesperadas como unknown", () => {
    expect(toRpgConfigRepositoryError(new Error("connection refused")).code).toBe(
      "unknown",
    )
  })
})
