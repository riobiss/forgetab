import type { AuthCookieConfig } from "@/features/auth/application/types"

export interface AuthTokenService {
  createToken(payload: { userId: string; email: string }): Promise<string>
  getCookieConfig(): AuthCookieConfig
}
