import type { AuthRateLimitResult } from "@/features/auth/application/types"

export interface AuthRateLimitService {
  getClientIp(request: Request): string
  check(key: string, limit: number, windowMs: number): Promise<AuthRateLimitResult>
}
