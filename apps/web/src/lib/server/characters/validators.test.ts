import { describe, expect, it } from "vitest"
import { normalizeOptionalText } from "./validators"

describe("server character validators compatibility", () => {
  it("mantem a fachada legada apontando para o modulo de aplicacao", () => {
    expect(normalizeOptionalText("  texto  ")).toBe("texto")
    expect(normalizeOptionalText("   ")).toBeNull()
  })
})
