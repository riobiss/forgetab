import { describe, expect, it, vi } from "vitest"
import type { RandomNumberProvider } from "@/application/random/ports/RandomNumberProvider"
import {
  DICE_ROLL_MAX_GROUPS,
  rollDicesUseCase,
} from "@/application/dices/use-cases/rollDices"

function makeRandomNumberProvider(): RandomNumberProvider {
  return {
    generateIntegers: vi.fn().mockImplementation(async ({ count, max }) => ({
      provider: max === 20 ? "random-org" : "local",
      numbers: Array.from({ length: count }, (_, index) => index + 1),
    })),
  }
}

describe("api rollDicesUseCase", () => {
  it("rola grupos validos e soma cada grupo", async () => {
    const randomNumberProvider = makeRandomNumberProvider()

    const result = await rollDicesUseCase(randomNumberProvider, [
      { diceCount: 2, diceSides: 20 },
      { diceCount: 3, diceSides: 6 },
    ])

    expect(randomNumberProvider.generateIntegers).toHaveBeenCalledTimes(2)
    expect(randomNumberProvider.generateIntegers).toHaveBeenNthCalledWith(1, {
      count: 2,
      min: 1,
      max: 20,
    })
    expect(result).toEqual({
      provider: "random-org",
      groups: [
        {
          diceCount: 2,
          diceSides: 20,
          results: [1, 2],
          total: 3,
        },
        {
          diceCount: 3,
          diceSides: 6,
          results: [1, 2, 3],
          total: 6,
        },
      ],
    })
  })

  it("rejeita lista vazia ou maior que o limite", async () => {
    const randomNumberProvider = makeRandomNumberProvider()

    await expect(rollDicesUseCase(randomNumberProvider, [])).rejects.toMatchObject({
      message: `Escolha entre 1 e ${DICE_ROLL_MAX_GROUPS} linhas de dados.`,
      status: 400,
    })

    await expect(
      rollDicesUseCase(
        randomNumberProvider,
        Array.from({ length: DICE_ROLL_MAX_GROUPS + 1 }, () => ({ diceCount: 1, diceSides: 6 })),
      ),
    ).rejects.toMatchObject({
      message: `Escolha entre 1 e ${DICE_ROLL_MAX_GROUPS} linhas de dados.`,
      status: 400,
    })
  })

  it("rejeita quantidade e lados invalidos", async () => {
    const randomNumberProvider = makeRandomNumberProvider()

    await expect(rollDicesUseCase(randomNumberProvider, [{ diceCount: 0, diceSides: 20 }])).rejects.toMatchObject({
      message: "Escolha entre 1 e 100 dados por linha.",
      status: 400,
    })

    await expect(rollDicesUseCase(randomNumberProvider, [{ diceCount: 1, diceSides: 1001 }])).rejects.toMatchObject({
      message: "Escolha um dado entre 2 e 1000 lados por linha.",
      status: 400,
    })
  })
})
