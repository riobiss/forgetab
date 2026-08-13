import { describe, expect, it, vi } from "vitest"
import type { AuthClientDependencies } from "@/features/auth/application/contracts/AuthClientGateway"
import {
  loginClientUseCase,
  logoutClientUseCase,
  registerClientUseCase
} from "@/features/auth/application/use-cases/authClient"

function makeDependencies(): AuthClientDependencies {
  return {
    gateway: {
      login: vi.fn().mockResolvedValue({ token: "login-token", maxAge: 60 }),
      register: vi
        .fn()
        .mockResolvedValue({ token: "register-token", maxAge: 120 }),
      logout: vi.fn().mockResolvedValue(undefined)
    },
    session: {
      persist: vi.fn(),
      clear: vi.fn()
    },
    offlineData: { clear: vi.fn().mockResolvedValue(undefined) }
  }
}

describe("auth client use cases", () => {
  it("persiste a sessao depois do login", async () => {
    const deps = makeDependencies()

    await loginClientUseCase(deps, {
      email: "user@email.com",
      password: "12345678"
    })

    expect(deps.session.persist).toHaveBeenCalledWith("login-token", 60)
  })

  it("persiste a sessao depois do cadastro", async () => {
    const deps = makeDependencies()

    await registerClientUseCase(deps, {
      name: "User",
      username: "user_1",
      email: "user@email.com",
      password: "12345678"
    })

    expect(deps.session.persist).toHaveBeenCalledWith("register-token", 120)
  })

  it("limpa a sessao local mesmo quando o logout remoto falha", async () => {
    const deps = makeDependencies()
    vi.mocked(deps.gateway.logout).mockRejectedValueOnce(new Error("offline"))

    await expect(logoutClientUseCase(deps)).rejects.toThrow("offline")

    expect(deps.session.clear).toHaveBeenCalledOnce()
    expect(deps.offlineData?.clear).toHaveBeenCalledOnce()
  })
})
