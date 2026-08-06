import { describe, expect, it } from "vitest"

import { RpgMembershipRepositoryError } from "@/features/world/application/membership/errors/RpgMembershipRepositoryError"

import { toRpgMembershipRepositoryError } from "./rpgMembershipPersistenceErrors"

describe("toRpgMembershipRepositoryError", () => {
  it.each([
    ['relation "rpg_members" does not exist', "members_schema_missing"],
    [
      'relation "rpg_character_creation_requests" does not exist',
      "character_requests_schema_missing"
    ]
  ] as const)("traduz %s para %s", (message, code) => {
    const source = new Error(message)
    const result = toRpgMembershipRepositoryError(source)

    expect(result).toBeInstanceOf(RpgMembershipRepositoryError)
    expect(result.code).toBe(code)
    expect(result.cause).toBe(source)
  })

  it("preserva erros de repositorio ja tipados", () => {
    const source = new RpgMembershipRepositoryError("unknown")

    expect(toRpgMembershipRepositoryError(source)).toBe(source)
  })

  it("classifica falhas inesperadas como unknown", () => {
    expect(
      toRpgMembershipRepositoryError(new Error("connection refused")).code
    ).toBe("unknown")
  })
})
