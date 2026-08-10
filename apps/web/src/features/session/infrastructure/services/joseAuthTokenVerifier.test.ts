// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SignJWT } from "jose"
import { joseAuthTokenVerifier } from "./joseAuthTokenVerifier"

describe("joseAuthTokenVerifier", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "jwt-test-secret-with-enough-entropy")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("valida os claims da sessao", async () => {
    const token = await new SignJWT({
      userId: "user-1",
      email: "user@example.com"
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("jwt-test-secret-with-enough-entropy"))

    await expect(joseAuthTokenVerifier.verify(token)).resolves.toEqual({
      userId: "user-1",
      email: "user@example.com"
    })
  })

  it("rejeita token sem os claims obrigatorios", async () => {
    const token = await new SignJWT({ userId: "user-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("jwt-test-secret-with-enough-entropy"))

    await expect(joseAuthTokenVerifier.verify(token)).rejects.toThrow(
      "Token de autenticacao invalido."
    )
  })

  it("rejeita algoritmo diferente de HS256", async () => {
    const token = await new SignJWT({
      userId: "user-1",
      email: "user@example.com"
    })
      .setProtectedHeader({ alg: "HS384" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("jwt-test-secret-with-enough-entropy"))

    await expect(joseAuthTokenVerifier.verify(token)).rejects.toThrow()
  })
})
