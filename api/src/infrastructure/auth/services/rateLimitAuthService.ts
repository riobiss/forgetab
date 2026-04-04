import type { AuthRateLimitService } from "@/application/auth/ports/AuthRateLimitService"
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit"

export const rateLimitAuthService: AuthRateLimitService = {
  check: checkRateLimit,
  getClientIp,
}
