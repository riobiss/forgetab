import type { IncomingHttpHeaders } from "node:http"
import type { AuthRateLimitResult } from "@/application/auth/types"

export interface AuthRateLimitService {
  getClientIp(headers: IncomingHttpHeaders): string
  check(key: string, limit: number, windowMs: number): Promise<AuthRateLimitResult>
}
