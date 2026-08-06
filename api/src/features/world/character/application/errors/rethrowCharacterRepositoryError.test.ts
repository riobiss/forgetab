import { describe, expect, it } from "vitest"
import { CharacterRepositoryError } from "@/features/world/character/application/errors/CharacterRepositoryError"
import { rethrowCharacterRepositoryError } from "@/features/world/character/application/errors/rethrowCharacterRepositoryError"

describe("rethrowCharacterRepositoryError", () => {
  it.each([
    [
      "character_schema_missing",
      "Tabela de personagens nao existe no banco. Rode a migration."
    ],
    [
      "character_schema_outdated",
      "Estrutura de personagens desatualizada. Rode a migration mais recente."
    ],
    [
      "template_schema_missing",
      "Estrutura de racas/classes nao existe no banco. Rode a migration."
    ],
    [
      "progression_schema_outdated",
      "Estrutura de progressao desatualizada. Rode a migration mais recente."
    ]
  ] as const)("maps %s to an application error", (code, message) => {
    expect(() =>
      rethrowCharacterRepositoryError(new CharacterRepositoryError(code))
    ).toThrow(
      expect.objectContaining({
        name: "AppError",
        status: 500,
        message
      })
    )
  })

  it("does not hide unknown persistence failures", () => {
    const error = new CharacterRepositoryError("unknown")

    expect(() => rethrowCharacterRepositoryError(error)).toThrow(error)
  })
})
