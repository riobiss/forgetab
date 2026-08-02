import { describe, expect, it } from "vitest"
import { AppError } from "@/features/shared/application/errors/AppError"
import { SkillRepositoryError } from "@/features/world/skill/application/errors/SkillRepositoryError"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

describe("mapSkillError", () => {
  it.each([
    ["duplicate_slug", 409, "Slug ja utilizado neste escopo (owner + rpg)."],
    [
      "skills_schema_missing",
      500,
      "Tabela skills nao existe no banco. Rode a migration.",
    ],
    [
      "skill_levels_schema_missing",
      500,
      "Tabela skill_levels nao existe no banco. Rode a migration.",
    ],
  ] as const)("traduz %s", (code, status, message) => {
    expect(() =>
      mapSkillError(new SkillRepositoryError(code), "fallback"),
    ).toThrow(expect.objectContaining({ status, message }))
  })

  it("preserva erros de aplicacao", () => {
    const error = new AppError("invalido", 400)
    expect(() => mapSkillError(error, "fallback")).toThrow(error)
  })

  it("oculta erros desconhecidos com uma mensagem estavel", () => {
    expect(() => mapSkillError(new Error("driver secret"), "fallback")).toThrow(
      expect.objectContaining({ status: 500, message: "fallback" }),
    )
  })
})
