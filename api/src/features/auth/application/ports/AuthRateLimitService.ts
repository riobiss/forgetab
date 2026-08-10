import type { AuthRateLimitResult } from "@/features/auth/application/types"

export interface AuthRateLimitService {
  check(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<AuthRateLimitResult>
}
