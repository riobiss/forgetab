import type { AuthCookieConfig } from "@/application/auth/types"

export interface AuthTokenService {
  createToken(payload: { userId: string; email: string }): Promise<string>
  getCookieConfig(): AuthCookieConfig
}
