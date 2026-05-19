import { describe, expect, it, vi } from "vitest"
import type { DicesRepository } from "@/application/dices/ports/DicesRepository"
import { rollDicesUseCase, validateDiceRollInput } from "@/application/dices/use-cases/rollDices"

function makeRepository(): DicesRepository {
  return {
    roll: vi.fn().mockResolvedValue({
      provider: "random-org",
      groups: [
        {
          diceCount: 2,
          diceSides: 20,
          results: [7, 18],
          total: 25,
        },
      ],
    }),
  }
}

describe("rollDicesUseCase", () => {
  it("monta uma rolagem de historico a partir do repositorio", async () => {
    const dicesRepository = makeRepository()

    const result = await rollDicesUseCase(
      {
        dicesRepository,
        createHistoryId: () => "roll-1",
        now: () => new Date("2026-05-19T10:00:00.000Z"),
      },
      { diceCount: "2", diceSides: "20", modifier: "3" },
    )

    expect(dicesRepository.roll).toHaveBeenCalledWith({
      entries: [{ diceCount: 2, diceSides: 20 }],
    })
    expect(result).toMatchObject({
      id: "roll-1",
      provider: "random-org",
      diceTotal: 25,
      modifier: 3,
      total: 28,
    })
    expect(result.rolledAt.toISOString()).toBe("2026-05-19T10:00:00.000Z")
  })

  it("valida a quantidade antes de chamar o repositorio", async () => {
    const dicesRepository = makeRepository()

    await expect(
      rollDicesUseCase(
        {
          dicesRepository,
          createHistoryId: () => "roll-1",
          now: () => new Date(),
        },
        { diceCount: "101", diceSides: "20", modifier: "0" },
      ),
    ).rejects.toThrow("Escolha entre 1 e 100 dados.")

    expect(dicesRepository.roll).not.toHaveBeenCalled()
  })

  it("propaga a mensagem segura do repositorio", async () => {
    const dicesRepository: DicesRepository = {
      roll: vi.fn().mockRejectedValue(new Error("Nao foi possivel girar os dados agora. Tente novamente.")),
    }

    await expect(
      rollDicesUseCase(
        {
          dicesRepository,
          createHistoryId: () => "roll-1",
          now: () => new Date(),
        },
        { diceCount: "1", diceSides: "20", modifier: "0" },
      ),
    ).rejects.toThrow("Nao foi possivel girar os dados agora. Tente novamente.")
  })
})

describe("validateDiceRollInput", () => {
  it("normaliza numeros validos", () => {
    expect(validateDiceRollInput({ diceCount: "3", diceSides: "12", modifier: "-2" })).toEqual({
      diceCount: 3,
      diceSides: 12,
      modifier: -2,
    })
  })

  it("rejeita lados e modificador invalidos", () => {
    expect(() => validateDiceRollInput({ diceCount: "1", diceSides: "1", modifier: "0" })).toThrow(
      "Escolha um dado entre 2 e 1000 lados.",
    )
    expect(() => validateDiceRollInput({ diceCount: "1", diceSides: "20", modifier: "1.5" })).toThrow(
      "Informe um modificador inteiro.",
    )
  })
})
