import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SignJWT } from "jose"
import { jwtAuthTokenService } from "./jwtAuthTokenService"

describe("jwtAuthTokenService", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "jwt-test-secret-with-enough-entropy")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("cria e valida tokens com o contrato esperado", async () => {
    const token = await jwtAuthTokenService.createToken({
      userId: "user-1",
      email: "user@example.com"
    })

    await expect(jwtAuthTokenService.verifyToken(token)).resolves.toEqual({
      userId: "user-1",
      email: "user@example.com"
    })
    expect(jwtAuthTokenService.getCookieConfig()).toMatchObject({
      name: "auth_token",
      maxAge: 60 * 60 * 24 * 30
    })
  })

  it("rejeita algoritmo diferente de HS256", async () => {
    const secret = new TextEncoder().encode(
      "jwt-test-secret-with-enough-entropy"
    )
    const token = await new SignJWT({
      userId: "user-1",
      email: "user@example.com"
    })
      .setProtectedHeader({ alg: "HS384" })
      .setExpirationTime("1h")
      .sign(secret)

    await expect(jwtAuthTokenService.verifyToken(token)).rejects.toThrow()
  })
})
