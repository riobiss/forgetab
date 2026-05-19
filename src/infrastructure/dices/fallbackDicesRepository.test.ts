import { describe, expect, it, vi } from "vitest"
import type { DicesRepository } from "@/application/dices/ports/DicesRepository"
import { createFallbackDicesRepository } from "@/infrastructure/dices/fallbackDicesRepository"
import {
  DicesTechnicalError,
  DicesValidationError,
} from "@/infrastructure/dices/httpDicesRepository"

const payload = { entries: [{ diceCount: 1, diceSides: 20 }] }
const localResponse = {
  provider: "local" as const,
  groups: [{ diceCount: 1, diceSides: 20, results: [12], total: 12 }],
}
const randomOrgResponse = {
  provider: "random-org" as const,
  groups: [{ diceCount: 1, diceSides: 20, results: [20], total: 20 }],
}

function makeRepository(response: unknown): DicesRepository {
  return {
    roll: vi.fn().mockResolvedValue(response),
  }
}

describe("fallbackDicesRepository", () => {
  it("usa o repositorio local direto quando o navegador esta offline", async () => {
    const primaryRepository = makeRepository(randomOrgResponse)
    const fallbackRepository = makeRepository(localResponse)
    const repository = createFallbackDicesRepository(primaryRepository, fallbackRepository, {
      isOffline: () => true,
    })

    await expect(repository.roll(payload)).resolves.toEqual(localResponse)
    expect(primaryRepository.roll).not.toHaveBeenCalled()
    expect(fallbackRepository.roll).toHaveBeenCalledWith(payload)
  })

  it("usa fallback local quando o repositorio principal falha tecnicamente", async () => {
    const primaryRepository: DicesRepository = {
      roll: vi.fn().mockRejectedValue(new DicesTechnicalError("Nao foi possivel girar os dados agora.")),
    }
    const fallbackRepository = makeRepository(localResponse)
    const repository = createFallbackDicesRepository(primaryRepository, fallbackRepository, {
      isOffline: () => false,
    })

    await expect(repository.roll(payload)).resolves.toEqual(localResponse)
    expect(fallbackRepository.roll).toHaveBeenCalledWith(payload)
  })

  it("nao usa fallback para erro de validacao", async () => {
    const primaryRepository: DicesRepository = {
      roll: vi.fn().mockRejectedValue(new DicesValidationError("Escolha entre 1 e 100 dados por linha.")),
    }
    const fallbackRepository = makeRepository(localResponse)
    const repository = createFallbackDicesRepository(primaryRepository, fallbackRepository)

    await expect(repository.roll(payload)).rejects.toThrow("Escolha entre 1 e 100 dados por linha.")
    expect(fallbackRepository.roll).not.toHaveBeenCalled()
  })
})
