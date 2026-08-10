import { afterEach, describe, expect, it, vi } from "vitest"
import { resolveAllowedOrigin } from "./cors"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("resolveAllowedOrigin", () => {
  it("aceita uma origem explicitamente configurada", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("FRONTEND_URL", "https://app.example.com")

    expect(resolveAllowedOrigin({ origin: "https://app.example.com" })).toBe(
      "https://app.example.com"
    )
  })

  it("rejeita origens nao configuradas em producao", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("FRONTEND_URL", "https://app.example.com")

    expect(resolveAllowedOrigin({ origin: "https://evil.example" })).toBeNull()
  })

  it("permite origens locais somente fora de producao", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("FRONTEND_URL", "")

    expect(resolveAllowedOrigin({ origin: "http://localhost:3000" })).toBe(
      "http://localhost:3000"
    )
    expect(resolveAllowedOrigin({ origin: "https://evil.example" })).toBeNull()
  })
})
