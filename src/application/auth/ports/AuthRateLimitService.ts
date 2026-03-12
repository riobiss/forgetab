import type { AuthRateLimitResult } from "@/application/auth/types"

export interface AuthRateLimitService {
  getClientIp(request: Request): string
  check(key: string, limit: number, windowMs: number): Promise<AuthRateLimitResult>
}
