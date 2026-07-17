import { afterEach, describe, expect, it, vi } from "vitest"

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
const originalInternalApiBaseUrl = process.env.API_INTERNAL_BASE_URL

afterEach(() => {
  vi.resetModules()
  vi.unmock("next/headers")
  vi.unstubAllEnvs()
  process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl
  process.env.API_INTERNAL_BASE_URL = originalInternalApiBaseUrl
})

describe("resolveApiUrl", () => {
  it("usa a origem da requisicao atual no server quando nao ha base URL explicita", async () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.API_INTERNAL_BASE_URL
    vi.stubGlobal("window", undefined)

    vi.doMock("next/headers", () => ({
      headers: async () =>
        new Headers({
          "x-forwarded-proto": "https",
          "x-forwarded-host": "example.com",
        }),
    }))

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe("https://example.com/api/rpg")
    vi.unstubAllGlobals()
  })

  it("prioriza API_INTERNAL_BASE_URL no server quando configurada", async () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.API_INTERNAL_BASE_URL = "http://api-internal:4000/"
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    vi.stubGlobal("window", undefined)

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe("http://api-internal:4000/api/rpg")
    vi.unstubAllGlobals()
  })

  it("normaliza base URL publica sem protocolo usando HTTPS", async () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.NEXT_PUBLIC_API_BASE_URL = "forgetab-api-production.up.railway.app/"
    delete process.env.API_INTERNAL_BASE_URL
    vi.stubGlobal("window", undefined)

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe("https://forgetab-api-production.up.railway.app/api/rpg")
    vi.unstubAllGlobals()
  })

  it("normaliza base URL local sem protocolo usando HTTP", async () => {
    vi.stubEnv("NODE_ENV", "development")
    process.env.NEXT_PUBLIC_API_BASE_URL = "localhost:4000/"
    delete process.env.API_INTERNAL_BASE_URL
    vi.stubGlobal("window", undefined)

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe("http://localhost:4000/api/rpg")
    vi.unstubAllGlobals()
  })

  it("mantem caminho relativo no browser sem base URL publica configurada", async () => {
    vi.stubEnv("NODE_ENV", "development")
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.API_INTERNAL_BASE_URL

    vi.stubGlobal("window", {
      location: { origin: "http://localhost:3000" },
    })

    const { resolveApiUrl } = await import("./backendUrls")

    await expect(resolveApiUrl("/api/rpg")).resolves.toBe("/api/rpg")
    vi.unstubAllGlobals()
  })
})
