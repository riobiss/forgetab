import type { AuthRateLimitService } from "@/features/auth/application/ports/AuthRateLimitService"

type RateLimitEntry = {
  count: number
  expiresAt: number
}

const store = new Map<string, RateLimitEntry>()
const MAX_LOCAL_KEYS = 10_000

function cleanupExpiredEntries(currentTime: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= currentTime) {
      store.delete(key)
    }
  }
}

function checkRateLimitLocal(key: string, limit: number, windowMs: number) {
  const currentTime = Date.now()
  if (store.size >= MAX_LOCAL_KEYS) {
    cleanupExpiredEntries(currentTime)
  }
  cleanupExpiredEntries(currentTime)

  const current = store.get(key)
  if (!current || current.expiresAt <= currentTime) {
    store.set(key, { count: 1, expiresAt: currentTime + windowMs })
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000)
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.expiresAt - currentTime) / 1000)
      )
    }
  }

  current.count += 1
  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((current.expiresAt - currentTime) / 1000)
    )
  }
}

export const rateLimitAuthService: AuthRateLimitService = {
  async check(key, limit, windowMs) {
    return checkRateLimitLocal(key, limit, windowMs)
  }
}
