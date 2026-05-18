import { AppError } from "@/shared/errors/AppError"
import type { RandomNumberProvider } from "@/application/random/ports/RandomNumberProvider"

export const DICE_ROLL_MAX_GROUPS = 20
export const DICE_ROLL_MAX_COUNT = 100
export const DICE_ROLL_MAX_SIDES = 1000

export type DiceRollEntryInput = {
  diceCount?: unknown
  diceSides?: unknown
}

export type DiceRollResult = {
  provider: "local" | "random-org"
  groups: Array<{
    diceCount: number
    diceSides: number
    results: number[]
    total: number
  }>
}

export async function rollDicesUseCase(
  randomNumberProvider: RandomNumberProvider,
  entries: DiceRollEntryInput[],
): Promise<DiceRollResult> {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > DICE_ROLL_MAX_GROUPS) {
    throw new AppError(`Escolha entre 1 e ${DICE_ROLL_MAX_GROUPS} linhas de dados.`, 400)
  }

  const groups: DiceRollResult["groups"] = []
  let provider: DiceRollResult["provider"] = "local"

  for (const entry of entries) {
    const diceCount = Number(entry.diceCount)
    const diceSides = Number(entry.diceSides)

    if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > DICE_ROLL_MAX_COUNT) {
      throw new AppError(`Escolha entre 1 e ${DICE_ROLL_MAX_COUNT} dados por linha.`, 400)
    }

    if (!Number.isInteger(diceSides) || diceSides < 2 || diceSides > DICE_ROLL_MAX_SIDES) {
      throw new AppError(`Escolha um dado entre 2 e ${DICE_ROLL_MAX_SIDES} lados por linha.`, 400)
    }

    const result = await randomNumberProvider.generateIntegers({
      count: diceCount,
      min: 1,
      max: diceSides,
    })

    if (result.provider === "random-org") {
      provider = "random-org"
    }

    groups.push({
      diceCount,
      diceSides,
      results: result.numbers,
      total: result.numbers.reduce((sum, value) => sum + value, 0),
    })
  }

  return {
    provider,
    groups,
  }
}
