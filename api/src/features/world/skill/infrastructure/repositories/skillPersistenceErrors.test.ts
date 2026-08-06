import { describe, expect, it } from "vitest"
import { SkillRepositoryError } from "@/features/world/skill/application/errors/SkillRepositoryError"
import {
  toSkillRepositoryError,
  withSkillPersistenceErrors
} from "@/features/world/skill/infrastructure/repositories/skillPersistenceErrors"

describe("skillPersistenceErrors", () => {
  it.each([
    ["skills_owner_id_rpg_scope_slug_key", "duplicate_slug"],
    ['relation "skills" does not exist', "skills_schema_missing"],
    ['relation "skill_levels" does not exist', "skill_levels_schema_missing"]
  ] as const)("classifica %s", (message, code) => {
    expect(toSkillRepositoryError(new Error(message))).toMatchObject({ code })
  })

  it("preserva erros de repositorio ja classificados", () => {
    const error = new SkillRepositoryError("unknown")
    expect(toSkillRepositoryError(error)).toBe(error)
  })

  it("encapsula falhas desconhecidas sem vazar detalhes do driver", async () => {
    await expect(
      withSkillPersistenceErrors(async () => {
        throw new Error("password=secret")
      })
    ).rejects.toMatchObject({
      name: "SkillRepositoryError",
      code: "unknown",
      message: "Falha ao acessar a persistencia de habilidades."
    })
  })
})
