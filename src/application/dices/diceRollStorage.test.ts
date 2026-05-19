import { describe, expect, it } from "vitest"
import { parseDicesStorageState } from "@/application/dices/diceRollStorage"

describe("parseDicesStorageState", () => {
  it("retorna null para storage vazio, corrompido ou incompleto", () => {
    expect(parseDicesStorageState(null)).toBeNull()
    expect(parseDicesStorageState("{invalid")).toBeNull()
    expect(parseDicesStorageState(JSON.stringify({ diceCount: "1" }))).toBeNull()
  })

  it("normaliza campos opcionais e filtra dados customizados invalidos", () => {
    const result = parseDicesStorageState(
      JSON.stringify({
        diceCount: "2",
        diceSides: "20",
        customSides: [1, 4, 1001, 12, "20"],
        history: [{ id: "roll-1" }],
      }),
    )

    expect(result).toEqual({
      diceCount: "2",
      diceSides: "20",
      modifier: "0",
      customSides: [4, 12],
      history: [{ id: "roll-1" }],
    })
  })
})
