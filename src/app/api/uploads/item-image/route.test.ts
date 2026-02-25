import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

import { DELETE, POST } from "./route"

const originalPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY
const originalEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

function makeRequest(method: "POST" | "DELETE", withAuth = true) {
  return new NextRequest("http://localhost/api/uploads/item-image", {
    method,
    headers: withAuth ? { cookie: "auth_token=test-token" } : undefined,
  })
}

describe("uploads/item-image", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "u1" })
    delete process.env.IMAGEKIT_PRIVATE_KEY
    delete process.env.IMAGEKIT_URL_ENDPOINT
  })

  afterEach(() => {
    process.env.IMAGEKIT_PRIVATE_KEY = originalPrivateKey
    process.env.IMAGEKIT_URL_ENDPOINT = originalEndpoint
  })

  it("POST retorna 401 sem autenticacao", async () => {
    const response = await POST(makeRequest("POST", false))
    expect(response.status).toBe(401)
  })

  it("POST retorna 500 sem configuracao ImageKit", async () => {
    const response = await POST(makeRequest("POST"))
    expect(response.status).toBe(500)
  })

  it("DELETE retorna 500 sem configuracao ImageKit", async () => {
    const response = await DELETE(makeRequest("DELETE"))
    expect(response.status).toBe(500)
  })
})
