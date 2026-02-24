import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  hashPassword: vi.fn(),
  createAuthToken: vi.fn(),
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}))

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mocks.hashPassword,
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
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getClientIp.mockReturnValue("127.0.0.1")
    mocks.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      retryAfterSeconds: 60,
    })
  })

  it("retorna 429 quando limite por IP e excedido", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    })

    const response = await POST(
      makeRequest({
        name: "User",
        username: "user_1",
        email: "user@email.com",
        password: "12345678",
      }),
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("42")
  })

  it("retorna 409 quando email ja existe", async () => {
    mocks.findUnique.mockResolvedValueOnce({ id: "existing" })

    const response = await POST(
      makeRequest({
        name: "User",
        username: "user_1",
        email: "user@email.com",
        password: "12345678",
      }),
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      message: "Nao foi possivel concluir o cadastro com os dados informados.",
    })
  })

  it("retorna 201 e cookie quando cadastro e valido", async () => {
    mocks.findUnique.mockResolvedValueOnce(null)
    mocks.findUnique.mockResolvedValueOnce(null)
    mocks.hashPassword.mockResolvedValue("hashed-password")
    mocks.create.mockResolvedValue({
      id: "u1",
      name: "User",
      username: "user_1",
      email: "user@email.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    mocks.createAuthToken.mockResolvedValue("jwt-token")

    const response = await POST(
      makeRequest({
        name: "User",
        username: "user_1",
        email: "USER@email.com",
        password: "12345678",
      }),
    )

    expect(response.status).toBe(201)
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: "User",
        username: "user_1",
        email: "user@email.com",
        passwordHash: "hashed-password",
      },
    })
    expect(response.headers.get("set-cookie")).toContain("auth_token=jwt-token")
  })
})
