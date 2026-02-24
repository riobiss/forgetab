import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  comparePassword: vi.fn(),
  createAuthToken: vi.fn(),
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
    },
  },
}))

vi.mock("@/lib/auth/password", () => ({
  comparePassword: mocks.comparePassword,
}))

vi.mock("@/lib/auth/token", () => ({
  createAuthToken: mocks.createAuthToken,
  TOKEN_COOKIE_NAME: "auth_token",
  TOKEN_EXPIRES_IN_SECONDS: 604800,
}))

vi.mock("@/lib/security/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientIp: mocks.getClientIp,
}))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getClientIp.mockReturnValue("127.0.0.1")
    mocks.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      retryAfterSeconds: 60,
    })
  })

  it("retorna 400 para payload invalido", async () => {
    const response = await POST(makeRequest({ email: "invalido", password: "" }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Email invalido." })
  })

  it("retorna 401 quando usuario nao existe", async () => {
    mocks.findUnique.mockResolvedValue(null)

    const response = await POST(
      makeRequest({ email: "USER@email.com", password: "12345678" }),
    )

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { email: "user@email.com" },
    })
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Credenciais invalidas." })
  })

  it("retorna 200 e cookie quando login e valido", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "u1",
      name: "User",
      username: "user",
      email: "user@email.com",
      passwordHash: "hash",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    mocks.comparePassword.mockResolvedValue(true)
    mocks.createAuthToken.mockResolvedValue("jwt-token")

    const response = await POST(
      makeRequest({ email: "USER@email.com", password: "12345678" }),
    )

    expect(response.status).toBe(200)
    expect(mocks.comparePassword).toHaveBeenCalledWith("12345678", "hash")
    expect(mocks.createAuthToken).toHaveBeenCalledWith({
      userId: "u1",
      email: "user@email.com",
    })
    expect(response.headers.get("set-cookie")).toContain("auth_token=jwt-token")
  })
})
