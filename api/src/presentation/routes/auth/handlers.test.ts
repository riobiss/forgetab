import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  createUser: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
  createToken: vi.fn(),
  getCookieConfig: vi.fn(),
  check: vi.fn(),
  getClientIp: vi.fn(),
}))

vi.mock("@/infrastructure/auth/repositories/prismaAuthRepository", () => ({
  prismaAuthRepository: {
    findUserByEmail: mocks.findUserByEmail,
    findUserByUsername: mocks.findUserByUsername,
    createUser: mocks.createUser,
  },
}))

vi.mock("@/infrastructure/auth/services/bcryptAuthPasswordService", () => ({
  bcryptAuthPasswordService: {
    compare: mocks.compare,
    hash: mocks.hash,
  },
}))

vi.mock("@/infrastructure/auth/services/jwtAuthTokenService", () => ({
  jwtAuthTokenService: {
    createToken: mocks.createToken,
    getCookieConfig: mocks.getCookieConfig,
  },
}))

vi.mock("@/infrastructure/auth/services/rateLimitAuthService", () => ({
  rateLimitAuthService: {
    check: mocks.check,
    getClientIp: mocks.getClientIp,
  },
}))

import { buildApiServer } from "@api/app"

describe("auth routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getClientIp.mockReturnValue("127.0.0.1")
    mocks.getCookieConfig.mockReturnValue({
      name: "auth_token",
      maxAge: 604800,
    })
    mocks.check.mockResolvedValue({
      allowed: true,
      remaining: 10,
      retryAfterSeconds: 60,
    })
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 400 para payload invalido no login", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "invalido", password: "" },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: "Email invalido." })
  })

  it("retorna 401 quando usuario nao existe no login", async () => {
    server = buildApiServer()
    mocks.findUserByEmail.mockResolvedValue(null)

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "USER@email.com", password: "12345678" },
    })

    expect(mocks.findUserByEmail).toHaveBeenCalledWith("user@email.com")
    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Credenciais invalidas." })
  })

  it("retorna 200 e cookie quando login e valido", async () => {
    server = buildApiServer()
    mocks.findUserByEmail.mockResolvedValue({
      id: "u1",
      name: "User",
      username: "user",
      email: "user@email.com",
      passwordHash: "hash",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    mocks.compare.mockResolvedValue(true)
    mocks.createToken.mockResolvedValue("jwt-token")

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "USER@email.com", password: "12345678" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.compare).toHaveBeenCalledWith("12345678", "hash")
    expect(mocks.createToken).toHaveBeenCalledWith({
      userId: "u1",
      email: "user@email.com",
    })
    expect(response.headers["set-cookie"]).toContain("auth_token=jwt-token")
  })

  it("retorna 429 quando limite por IP e excedido no cadastro", async () => {
    server = buildApiServer()
    mocks.check.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "User",
        username: "user_1",
        email: "user@email.com",
        password: "12345678",
      },
    })

    expect(response.statusCode).toBe(429)
    expect(response.headers["retry-after"]).toBe("42")
  })

  it("retorna 409 quando email ja existe no cadastro", async () => {
    server = buildApiServer()
    mocks.findUserByEmail.mockResolvedValueOnce({ id: "existing" })

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "User",
        username: "user_1",
        email: "user@email.com",
        password: "12345678",
      },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      message: "Nao foi possivel concluir o cadastro com os dados informados.",
    })
  })

  it("retorna 201 e cookie quando cadastro e valido", async () => {
    server = buildApiServer()
    mocks.findUserByEmail.mockResolvedValueOnce(null)
    mocks.findUserByUsername.mockResolvedValueOnce(null)
    mocks.hash.mockResolvedValue("hashed-password")
    mocks.createUser.mockResolvedValue({
      id: "u1",
      name: "User",
      username: "user_1",
      email: "user@email.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    mocks.createToken.mockResolvedValue("jwt-token")

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "User",
        username: "user_1",
        email: "USER@email.com",
        password: "12345678",
      },
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createUser).toHaveBeenCalledWith({
      name: "User",
      username: "user_1",
      email: "user@email.com",
      passwordHash: "hashed-password",
    })
    expect(response.headers["set-cookie"]).toContain("auth_token=jwt-token")
  })

  it("retorna ok e expira o cookie no logout", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/logout",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })
    expect(response.headers["set-cookie"]).toContain("auth_token=")
    expect(response.headers["set-cookie"]).toContain("Max-Age=0")
  })
})
