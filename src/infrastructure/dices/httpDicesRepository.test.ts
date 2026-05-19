import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "@/infrastructure/http/apiFetch"
import {
  DicesTechnicalError,
  DicesValidationError,
  httpDicesRepository,
} from "@/infrastructure/dices/httpDicesRepository"

vi.mock("@/infrastructure/http/apiFetch", () => ({
  apiFetch: vi.fn(),
}))

const mockedApiFetch = vi.mocked(apiFetch)

describe("httpDicesRepository", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it("retorna a rolagem da API", async () => {
    mockedApiFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          provider: "random-org",
          groups: [{ diceCount: 1, diceSides: 20, results: [17], total: 17 }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    )

    await expect(httpDicesRepository.roll({ entries: [{ diceCount: 1, diceSides: 20 }] })).resolves.toEqual({
      provider: "random-org",
      groups: [{ diceCount: 1, diceSides: 20, results: [17], total: 17 }],
    })
  })

  it("mantem mensagens de validacao da API como erro de validacao", async () => {
    mockedApiFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: "Escolha entre 1 e 100 dados por linha." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    )

    const promise = httpDicesRepository.roll({ entries: [{ diceCount: 101, diceSides: 20 }] })

    await expect(promise).rejects.toThrow("Escolha entre 1 e 100 dados por linha.")
    await expect(promise).rejects.toBeInstanceOf(DicesValidationError)
  })

  it("troca falhas tecnicas por erro tecnico com mensagem segura", async () => {
    mockedApiFetch.mockRejectedValue(
      new Error("Falha ao conectar com a API em http://localhost:4000/api/dices/roll."),
    )

    const promise = httpDicesRepository.roll({ entries: [{ diceCount: 1, diceSides: 20 }] })

    await expect(promise).rejects.toThrow("Nao foi possivel girar os dados agora. Tente novamente.")
    await expect(promise).rejects.toBeInstanceOf(DicesTechnicalError)
  })

  it("troca respostas nao json por mensagem segura", async () => {
    mockedApiFetch.mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        headers: { "content-type": "text/plain" },
      }),
    )

    await expect(httpDicesRepository.roll({ entries: [{ diceCount: 1, diceSides: 20 }] })).rejects.toThrow(
      "Nao foi possivel girar os dados agora. Tente novamente.",
    )
  })
})
