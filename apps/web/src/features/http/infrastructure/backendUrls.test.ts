import { afterEach, describe, expect, it, vi } from "vitest"

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
const originalInternalApiBaseUrl = process.env.API_INTERNAL_BASE_URL

afterEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl
  process.env.API_INTERNAL_BASE_URL = originalInternalApiBaseUrl
})

describe("resolveApiUrl", () => {
  it("exige base URL explicita no server em producao", async () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.API_INTERNAL_BASE_URL
    vi.stubGlobal("window", undefined)

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).rejects.toThrow(
      "API base URL nao configurada"
    )
    vi.unstubAllGlobals()
  })

  it("prioriza API_INTERNAL_BASE_URL no server quando configurada", async () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.API_INTERNAL_BASE_URL = "http://api-internal:4000/"
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    vi.stubGlobal("window", undefined)

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe(
      "http://api-internal:4000/api/rpg"
    )
    vi.unstubAllGlobals()
  })

  it("normaliza base URL publica sem protocolo usando HTTPS", async () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.NEXT_PUBLIC_API_BASE_URL =
      "forgetab-api-production.up.railway.app/"
    delete process.env.API_INTERNAL_BASE_URL
    vi.stubGlobal("window", undefined)

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe(
      "https://forgetab-api-production.up.railway.app/api/rpg"
    )
    vi.unstubAllGlobals()
  })

  it("normaliza base URL local sem protocolo usando HTTP", async () => {
    vi.stubEnv("NODE_ENV", "development")
    process.env.NEXT_PUBLIC_API_BASE_URL = "localhost:4000/"
    delete process.env.API_INTERNAL_BASE_URL
    vi.stubGlobal("window", undefined)

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe(
      "http://localhost:4000/api/rpg"
    )
    vi.unstubAllGlobals()
  })

  it("usa a API local no browser sem base URL publica em desenvolvimento", async () => {
    vi.stubEnv("NODE_ENV", "development")
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.API_INTERNAL_BASE_URL

    vi.stubGlobal("window", {
      location: { origin: "http://localhost:3000" }
    })

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe(
      "http://localhost:4000/api/rpg"
    )
    vi.unstubAllGlobals()
  })

  it("rejeita URL absoluta para impedir chamadas fora da API configurada", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubGlobal("window", undefined)
    const { resolveApiUrl } = await import("./backendUrls")

    await expect(
      resolveApiUrl("https://attacker.example/collect")
    ).rejects.toThrow("must not be an absolute URL")
    vi.unstubAllGlobals()
  })
})
