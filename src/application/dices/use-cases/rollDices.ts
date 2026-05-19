import type { DicesRepository } from "@/application/dices/ports/DicesRepository"
import {
  DICE_ROLL_MAX_COUNT,
  DICE_ROLL_MAX_SIDES,
  type RollHistoryItem,
} from "@/application/dices/types"

export type RollDicesInput = {
  diceCount: string
  diceSides: string
  modifier: string
}

export type RollDicesDependencies = {
  dicesRepository: DicesRepository
  createHistoryId: () => string
  now: () => Date
}

export type ValidatedDiceRollInput = {
  diceCount: number
  diceSides: number
  modifier: number
}

export function validateDiceRollInput(input: RollDicesInput): ValidatedDiceRollInput {
  const diceCount = Number(input.diceCount)
  const diceSides = Number(input.diceSides)
  const modifier = Number(input.modifier)

  if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > DICE_ROLL_MAX_COUNT) {
    throw new Error(`Escolha entre 1 e ${DICE_ROLL_MAX_COUNT} dados.`)
  }

  if (!Number.isInteger(diceSides) || diceSides < 2 || diceSides > DICE_ROLL_MAX_SIDES) {
    throw new Error(`Escolha um dado entre 2 e ${DICE_ROLL_MAX_SIDES} lados.`)
  }

  if (!Number.isInteger(modifier)) {
    throw new Error("Informe um modificador inteiro.")
  }

  return {
    diceCount,
    diceSides,
    modifier,
  }
}

export async function rollDicesUseCase(
  dependencies: RollDicesDependencies,
  input: RollDicesInput,
): Promise<RollHistoryItem> {
  const entry = validateDiceRollInput(input)
  const payload = await dependencies.dicesRepository.roll({
    entries: [{ diceCount: entry.diceCount, diceSides: entry.diceSides }],
  })
  const diceTotal = payload.groups.reduce((sum, group) => sum + group.total, 0)

  return {
    id: dependencies.createHistoryId(),
    provider: payload.provider ?? "local",
    groups: payload.groups,
    diceTotal,
    modifier: entry.modifier,
    total: diceTotal + entry.modifier,
    rolledAt: dependencies.now(),
  }
}
