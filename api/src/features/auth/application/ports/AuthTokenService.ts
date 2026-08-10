import type {
  AuthCookieConfig,
  AuthTokenPayload
} from "@/features/auth/application/types"

export interface AuthTokenService {
  createToken(payload: AuthTokenPayload): Promise<string>
  getCookieConfig(): AuthCookieConfig
}

export interface AuthTokenVerifier {
  verifyToken(token: string): Promise<AuthTokenPayload>
  getCookieName(): string
}
