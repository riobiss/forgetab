import type {
  AuthTokenService,
  AuthTokenVerifier
} from "@/features/auth/application/ports/AuthTokenService"
import type { AuthTokenPayload } from "@/features/auth/application/types"
import { SignJWT, jwtVerify } from "jose"

const TOKEN_COOKIE_NAME = "auth_token"
const TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30

function getJwtSecret() {
  const configuredSecret =
    process.env.JWT_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.APP_SECRET_KEY

  if (!configuredSecret) {
    throw new Error(
      "JWT secret nao configurado. Defina JWT_SECRET (ou NEXTAUTH_SECRET/APP_SECRET_KEY)."
    )
  }

  return new TextEncoder().encode(configuredSecret)
}

export const jwtAuthTokenService: AuthTokenService & AuthTokenVerifier = {
  createToken(payload) {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${TOKEN_EXPIRES_IN_SECONDS}s`)
      .sign(getJwtSecret())
  },
  async verifyToken(token) {
    const { payload } = await jwtVerify<AuthTokenPayload>(
      token,
      getJwtSecret(),
      { algorithms: ["HS256"] }
    )
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string"
    ) {
      throw new Error("Token de autenticacao invalido.")
    }

    return { userId: payload.userId, email: payload.email }
  },
  getCookieName() {
    return TOKEN_COOKIE_NAME
  },
  getCookieConfig() {
    return {
      name: TOKEN_COOKIE_NAME,
      maxAge: TOKEN_EXPIRES_IN_SECONDS
    }
  }
}
