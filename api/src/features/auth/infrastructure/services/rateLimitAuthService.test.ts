import { describe, expect, it, vi } from "vitest"
import { rateLimitAuthService } from "./rateLimitAuthService"

describe("rateLimitAuthService", () => {
  it("bloqueia requisicoes acima do limite na mesma janela", async () => {
    const key = `test-limit-${crypto.randomUUID()}`

    await expect(
      rateLimitAuthService.check(key, 1, 60_000)
    ).resolves.toMatchObject({ allowed: true, remaining: 0 })
    await expect(
      rateLimitAuthService.check(key, 1, 60_000)
    ).resolves.toMatchObject({ allowed: false, remaining: 0 })
  })

  it("abre uma nova janela depois da expiracao", async () => {
    const now = vi.spyOn(Date, "now")
    const key = `test-window-${crypto.randomUUID()}`
    now.mockReturnValue(1_000)
    await rateLimitAuthService.check(key, 1, 500)

    now.mockReturnValue(1_501)
    await expect(
      rateLimitAuthService.check(key, 1, 500)
    ).resolves.toMatchObject({ allowed: true })
    now.mockRestore()
  })
})
