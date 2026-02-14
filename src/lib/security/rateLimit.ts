type RateLimitEntry = {
  count: number
  expiresAt: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

const store = new Map<string, RateLimitEntry>()

function now() {
  return Date.now()
}

function cleanupExpiredEntries(currentTime: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= currentTime) {
      store.delete(key)
    }
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return request.headers.get("x-real-ip") ?? "unknown"
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const currentTime = now()
  cleanupExpiredEntries(currentTime)

  const current = store.get(key)
  if (!current || current.expiresAt <= currentTime) {
    store.set(key, { count: 1, expiresAt: currentTime + windowMs })
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.expiresAt - currentTime) / 1000),
      ),
    }
  }

  current.count += 1
  store.set(key, current)
  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((current.expiresAt - currentTime) / 1000),
    ),
  }
}
