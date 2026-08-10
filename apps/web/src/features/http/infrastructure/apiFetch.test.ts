import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  resolveApiUrl: vi.fn(),
  getBrowserAuthToken: vi.fn()
}))

vi.mock("@/features/http/infrastructure/backendUrls", () => ({
  resolveApiUrl: mocks.resolveApiUrl
}))

vi.mock(
  "@/features/session/infrastructure/services/browserAuthSession",
  () => ({
    getBrowserAuthToken: mocks.getBrowserAuthToken
  })
)

import { apiFetch } from "./apiFetch"

describe("apiFetch", () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", fetchMock)
    mocks.resolveApiUrl.mockResolvedValue("https://api.example.com/api/test")
    mocks.getBrowserAuthToken.mockReturnValue("session-token")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("centraliza URL, credenciais e Authorization", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await apiFetch("/api/test")

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/test",
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers)
      })
    )
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer session-token")
  })

  it("preserva Authorization definido pelo consumidor", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await apiFetch("/api/test", {
      headers: { Authorization: "Bearer explicit-token" }
    })

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer explicit-token")
  })

  it("adiciona contexto ao erro de conexao", async () => {
    fetchMock.mockRejectedValue(new TypeError("network error"))

    await expect(apiFetch("/api/test")).rejects.toThrow(
      "Falha ao conectar com a API em https://api.example.com/api/test"
    )
  })
})
