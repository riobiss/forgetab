import { describe, expect, it } from "vitest"
import { normalizeCharactersDashboardFilterType } from "./filters"

describe("normalizeCharactersDashboardFilterType", () => {
  it.each(["player", "npc", "monster"] as const)(
    "preserva o filtro %s",
    (filter) => {
      expect(normalizeCharactersDashboardFilterType(filter)).toBe(filter)
    }
  )

  it("normaliza valores ausentes ou desconhecidos", () => {
    expect(normalizeCharactersDashboardFilterType()).toBe("all")
    expect(normalizeCharactersDashboardFilterType("invalid")).toBe("all")
  })
})
