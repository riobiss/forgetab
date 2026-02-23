import { SignJWT, jwtVerify } from "jose"

export const TOKEN_COOKIE_NAME = "auth_token"
export const TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7

const configuredSecret =
  process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.APP_SECRET_KEY

if (!configuredSecret) {
  throw new Error(
    "JWT secret nao configurado. Defina JWT_SECRET (ou NEXTAUTH_SECRET/APP_SECRET_KEY).",
  )
}

const secretValue = configuredSecret

export const jwtSecret = new TextEncoder().encode(secretValue)

type AuthTokenPayload = {
  userId: string
  email: string
}

export async function createAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRES_IN_SECONDS}s`)
    .sign(jwtSecret)
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify<AuthTokenPayload>(token, jwtSecret)
  return payload
}
