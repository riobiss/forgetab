import { describe, expect, it } from "vitest"
import {
  calculateDiceRollStats,
  flattenDiceResults,
  formatCurrentRollFormula,
  formatRollFormula,
  getDiceResultLevel,
  isHighDiceResult,
  isLowDiceResult,
} from "@/application/dices/diceRollPresentation"
import type { RollHistoryItem } from "@/application/dices/types"

const roll: RollHistoryItem = {
  id: "roll-1",
  provider: "random-org",
  groups: [
    {
      diceCount: 2,
      diceSides: 20,
      results: [1, 20],
      total: 21,
    },
    {
      diceCount: 1,
      diceSides: 6,
      results: [5],
      total: 5,
    },
  ],
  diceTotal: 26,
  modifier: 3,
  total: 29,
  rolledAt: new Date("2026-05-19T10:00:00.000Z"),
}

describe("diceRollPresentation", () => {
  it("formata formulas atuais e formulas de historico", () => {
    expect(formatCurrentRollFormula("2", "20", "3")).toBe("2d20+3")
    expect(formatCurrentRollFormula("2", "20", "-1")).toBe("2d20-1")
    expect(formatCurrentRollFormula("", "20", "0")).toBe("0d20")
    expect(formatRollFormula(roll.groups, roll.modifier)).toBe("2d20 + 1d6+3")
  })

  it("achata os resultados preservando o lado de cada dado", () => {
    expect(flattenDiceResults(roll)).toEqual([
      { value: 1, diceSides: 20 },
      { value: 20, diceSides: 20 },
      { value: 5, diceSides: 6 },
    ])
    expect(flattenDiceResults(null)).toEqual([])
  })

  it("classifica resultados por distancia dos extremos", () => {
    expect(getDiceResultLevel(1, 20)).toBe("extremeLow")
    expect(getDiceResultLevel(4, 20)).toBe("low")
    expect(getDiceResultLevel(10, 20)).toBe("neutral")
    expect(getDiceResultLevel(17, 20)).toBe("high")
    expect(getDiceResultLevel(20, 20)).toBe("extremeHigh")
  })

  it("calcula estatisticas da rolagem", () => {
    const results = flattenDiceResults(roll)
    const stats = calculateDiceRollStats(results, isHighDiceResult, isLowDiceResult)

    expect(stats).toEqual({
      max: 20,
      min: 1,
      highCount: 2,
      lowCount: 1,
      average: 26 / 3,
    })
  })

  it("retorna null para estatisticas sem resultados", () => {
    expect(calculateDiceRollStats([], isHighDiceResult, isLowDiceResult)).toBeNull()
  })
})
