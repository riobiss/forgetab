import { jwtVerify } from "jose"
import type {
  AuthTokenPayload,
  AuthTokenVerifier
} from "@/features/session/application/ports/AuthTokenVerifier"

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

export const joseAuthTokenVerifier: AuthTokenVerifier = {
  async verify(token) {
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
  }
}
