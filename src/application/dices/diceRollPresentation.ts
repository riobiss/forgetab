import type {
  DiceRollGroup,
  DiceRollResultItem,
  DiceRollStats,
  RollHistoryItem,
} from "@/application/dices/types"

export type DiceResultLevel = "extremeLow" | "low" | "neutral" | "high" | "extremeHigh"

export function formatRollFormula(groups: DiceRollGroup[], modifier = 0) {
  return `${groups.map((group) => `${group.diceCount}d${group.diceSides}`).join(" + ")}${
    modifier ? `${modifier > 0 ? "+" : ""}${modifier}` : ""
  }`
}

export function formatCurrentRollFormula(diceCount: string, diceSides: string, modifier: string) {
  const parsedModifier = Number(modifier)
  return `${Number(diceCount) || 0}d${Number(diceSides) || 0}${
    parsedModifier ? `${parsedModifier > 0 ? "+" : ""}${parsedModifier}` : ""
  }`
}

export function flattenDiceResults(roll: RollHistoryItem | null): DiceRollResultItem[] {
  return roll?.groups.flatMap((group) =>
    group.results.map((value) => ({ value, diceSides: group.diceSides })),
  ) ?? []
}

export function calculateDiceRollStats(
  results: DiceRollResultItem[],
  isHighResult: (result: DiceRollResultItem) => boolean,
  isLowResult: (result: DiceRollResultItem) => boolean,
): DiceRollStats | null {
  if (results.length === 0) return null

  return {
    max: Math.max(...results.map((result) => result.value)),
    min: Math.min(...results.map((result) => result.value)),
    highCount: results.filter(isHighResult).length,
    lowCount: results.filter(isLowResult).length,
    average: results.reduce((sum, result) => sum + result.value, 0) / results.length,
  }
}

export function getDiceResultLevel(value: number, diceSides: number): DiceResultLevel {
  const range = Math.max(diceSides - 1, 1)
  const lowDistance = (value - 1) / range
  const highDistance = (diceSides - value) / range

  if (value <= 1) return "extremeLow"
  if (value >= diceSides) return "extremeHigh"
  if (highDistance <= 0.2) return "high"
  if (lowDistance <= 0.2) return "low"
  return "neutral"
}

export function isHighDiceResult(result: DiceRollResultItem) {
  const level = getDiceResultLevel(result.value, result.diceSides)
  return level === "high" || level === "extremeHigh"
}

export function isLowDiceResult(result: DiceRollResultItem) {
  const level = getDiceResultLevel(result.value, result.diceSides)
  return level === "low" || level === "extremeLow"
}
