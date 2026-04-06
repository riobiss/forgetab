import { describe, expect, it, vi } from "vitest"
import { loginUseCase } from "@/application/auth/use-cases/login"

function makeDeps() {
  return {
    authRepository: {
      findUserByEmail: vi.fn(),
      findUserByUsername: vi.fn(),
      createUser: vi.fn(),
    },
    authPasswordService: {
      compare: vi.fn(),
      hash: vi.fn(),
    },
    authTokenService: {
      createToken: vi.fn(),
      getCookieConfig: vi.fn(() => ({ name: "auth_token", maxAge: 604800 })),
    },
    authRateLimitService: {
      getClientIp: vi.fn(),
      check: vi.fn().mockResolvedValue({
        allowed: true,
        remaining: 1,
        retryAfterSeconds: 60,
      }),
    },
  }
}

describe("loginUseCase", () => {
  it("retorna usuario e token para login valido", async () => {
    const deps = makeDeps()
    deps.authRepository.findUserByEmail.mockResolvedValue({
      id: "u1",
      name: "User",
      username: "user",
      email: "user@email.com",
      passwordHash: "hash",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    deps.authPasswordService.compare.mockResolvedValue(true)
    deps.authTokenService.createToken.mockResolvedValue("jwt-token")

    const result = await loginUseCase(
      { body: { email: "USER@email.com", password: "12345678" }, clientIp: "127.0.0.1" },
      deps,
    )

    expect(deps.authRepository.findUserByEmail).toHaveBeenCalledWith("user@email.com")
    expect(result.token).toBe("jwt-token")
    expect(result.user.id).toBe("u1")
  })

  it("retorna erro 401 para credenciais invalidas", async () => {
    const deps = makeDeps()
    deps.authRepository.findUserByEmail.mockResolvedValue(null)

    await expect(
      loginUseCase(
        { body: { email: "user@email.com", password: "12345678" }, clientIp: "127.0.0.1" },
        deps,
      ),
    ).rejects.toMatchObject({ message: "Credenciais invalidas.", status: 401 })
  })
})
