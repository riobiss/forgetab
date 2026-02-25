import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

import { POST } from "./route"

const originalPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY
const originalEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

function makeRequest(withAuth = true) {
  return new NextRequest("http://localhost/api/uploads/library-image", {
    method: "POST",
    headers: withAuth ? { cookie: "auth_token=test-token" } : undefined,
  })
}

describe("uploads/library-image", () => {
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
    const response = await POST(makeRequest(false))
    expect(response.status).toBe(401)
  })

  it("POST retorna 500 sem configuracao ImageKit", async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(500)
  })
})
