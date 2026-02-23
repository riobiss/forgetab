import { isIP } from "node:net"

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
const MAX_LOCAL_KEYS = 10_000

const upstashConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}

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

function cleanupIfStoreIsTooLarge(currentTime: number) {
  if (store.size < MAX_LOCAL_KEYS) return
  cleanupExpiredEntries(currentTime)
}

function normalizeIpCandidate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  // Bracketed IPv6 with optional port: [::1]:1234
  if (trimmed.startsWith("[")) {
    const endBracket = trimmed.indexOf("]")
    if (endBracket > 1) {
      const candidate = trimmed.slice(1, endBracket)
      return isIP(candidate) ? candidate : null
    }
    return null
  }

  // IPv4 with port: 1.2.3.4:1234
  const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/)
  if (ipv4WithPort?.[1] && isIP(ipv4WithPort[1]) === 4) {
    return ipv4WithPort[1]
  }

  return isIP(trimmed) ? trimmed : null
}

function firstValidIpFromHeader(value: string | null) {
  if (!value) return null
  const candidates = value.split(",")
  for (const candidate of candidates) {
    const normalized = normalizeIpCandidate(candidate)
    if (normalized) return normalized
  }
  return null
}

export function getClientIp(request: Request) {
  const priorityHeaders = [
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
  ]

  for (const headerName of priorityHeaders) {
    const ip = firstValidIpFromHeader(request.headers.get(headerName))
    if (ip) return ip
  }

  return "unknown"
}

function checkRateLimitLocal(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const currentTime = now()
  cleanupIfStoreIsTooLarge(currentTime)
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

type UpstashPipelineItem = {
  result?: number | string | null
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

async function checkRateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const { url, token } = upstashConfig
  if (!url || !token) return null

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const pipelineCommands = [
    ["INCR", key],
    ["EXPIRE", key, String(windowSeconds), "NX"],
    ["TTL", key],
  ]

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipelineCommands),
      cache: "no-store",
    })

    if (!response.ok) return null

    const payload = (await response.json()) as { result?: UpstashPipelineItem[] } | UpstashPipelineItem[]
    const resultArray = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.result)
        ? payload.result
        : []

    const count = toNumber(resultArray[0]?.result)
    const ttl = toNumber(resultArray[2]?.result)

    if (count === null) return null

    const retryAfterSeconds =
      ttl && ttl > 0 ? ttl : Math.max(1, Math.ceil(windowMs / 1000))
    const allowed = count <= limit

    return {
      allowed,
      remaining: allowed ? Math.max(limit - count, 0) : 0,
      retryAfterSeconds,
    }
  } catch {
    return null
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const distributedResult = await checkRateLimitUpstash(key, limit, windowMs)
  if (distributedResult) return distributedResult
  return checkRateLimitLocal(key, limit, windowMs)
}
