import { describe, expect, it, vi } from "vitest"
import { registerUseCase } from "@/application/auth/use-cases/register"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

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
      getClientIp: vi.fn(() => "127.0.0.1"),
      check: vi.fn().mockResolvedValue({
        allowed: true,
        remaining: 1,
        retryAfterSeconds: 60,
      }),
    },
  }
}

describe("registerUseCase", () => {
  it("normaliza email/username e cria usuario", async () => {
    const deps = makeDeps()
    deps.authRepository.findUserByEmail.mockResolvedValue(null)
    deps.authRepository.findUserByUsername.mockResolvedValue(null)
    deps.authPasswordService.hash.mockResolvedValue("hashed-password")
    deps.authRepository.createUser.mockResolvedValue({
      id: "u1",
      name: "User",
      username: "user_1",
      email: "user@email.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    deps.authTokenService.createToken.mockResolvedValue("jwt-token")

    const result = await registerUseCase(
        makeRequest({
          name: "User",
          username: "user_1",
          email: "USER@email.com",
          password: "12345678",
        }),
      deps,
    )

    expect(deps.authRepository.createUser).toHaveBeenCalledWith({
      name: "User",
      username: "user_1",
      email: "user@email.com",
      passwordHash: "hashed-password",
    })
    expect(result.user.id).toBe("u1")
  })

  it("bloqueia conflito de username", async () => {
    const deps = makeDeps()
    deps.authRepository.findUserByEmail.mockResolvedValue(null)
    deps.authRepository.findUserByUsername.mockResolvedValue({ id: "existing" })

    await expect(
      registerUseCase(
        makeRequest({
          name: "User",
          username: "user_1",
          email: "user@email.com",
          password: "12345678",
        }),
        deps,
      ),
    ).rejects.toMatchObject({ message: "Username ja esta em uso. Tente outro.", status: 409 })
  })
})
