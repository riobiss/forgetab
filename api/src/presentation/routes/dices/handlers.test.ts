import type { FastifyReply, FastifyRequest } from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { rollDicesUseCase } from "@/application/dices/use-cases/rollDices"
import { AppError } from "@/shared/errors/AppError"
import { rollDicesHandler } from "@api/presentation/routes/dices/handlers"

vi.mock("@/application/dices/use-cases/rollDices", () => ({
  rollDicesUseCase: vi.fn(),
}))

vi.mock("@api/infrastructure/random/randomOrgRandomNumberProvider", () => ({
  randomOrgRandomNumberProvider: {
    generateIntegers: vi.fn(),
  },
}))

const mockedRollDicesUseCase = vi.mocked(rollDicesUseCase)

function makeReply() {
  return {
    code: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    send: vi.fn((payload) => payload),
  } as unknown as FastifyReply & {
    code: ReturnType<typeof vi.fn>
    header: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

function makeRequest(body: unknown) {
  return { body } as FastifyRequest
}

describe("rollDicesHandler", () => {
  beforeEach(() => {
    mockedRollDicesUseCase.mockReset()
  })

  it("retorna a rolagem em caso de sucesso", async () => {
    const reply = makeReply()
    const payload = {
      provider: "random-org" as const,
      groups: [{ diceCount: 1, diceSides: 20, results: [20], total: 20 }],
    }
    mockedRollDicesUseCase.mockResolvedValue(payload)

    await expect(
      rollDicesHandler(makeRequest({ entries: [{ diceCount: 1, diceSides: 20 }] }), reply),
    ).resolves.toEqual(payload)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(mockedRollDicesUseCase).toHaveBeenCalledWith(expect.anything(), [{ diceCount: 1, diceSides: 20 }])
  })

  it("retorna erro de validacao do use case", async () => {
    const reply = makeReply()
    mockedRollDicesUseCase.mockRejectedValue(new AppError("Escolha entre 1 e 100 dados por linha.", 400))

    await expect(
      rollDicesHandler(makeRequest({ entries: [{ diceCount: 101, diceSides: 20 }] }), reply),
    ).resolves.toEqual({ message: "Escolha entre 1 e 100 dados por linha." })

    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it("retorna mensagem generica para erro inesperado", async () => {
    const reply = makeReply()
    mockedRollDicesUseCase.mockRejectedValue(new Error("database offline"))

    await expect(rollDicesHandler(makeRequest({ entries: [{ diceCount: 1, diceSides: 20 }] }), reply)).resolves.toEqual({
      message: "Erro interno ao girar dados.",
    })

    expect(reply.code).toHaveBeenCalledWith(500)
  })
})
