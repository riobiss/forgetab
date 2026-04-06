import type { AuthTokenService } from "@/application/auth/ports/AuthTokenService"
import { createAuthToken } from "@/lib/auth/token"
import { TOKEN_COOKIE_NAME, TOKEN_EXPIRES_IN_SECONDS } from "@/lib/auth/constants"

export const jwtAuthTokenService: AuthTokenService = {
  createToken: createAuthToken,
  getCookieConfig() {
    return {
      name: TOKEN_COOKIE_NAME,
      maxAge: TOKEN_EXPIRES_IN_SECONDS,
    }
  },
}
