import type { IncomingHttpHeaders } from "node:http"
import { isIP } from "node:net"

const trustedIpHeader = (
  process.env.TRUSTED_IP_HEADER ?? "x-vercel-forwarded-for"
).toLowerCase()
const localFallbackHeaders = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for"
]

function normalizeIpCandidate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("[")) {
    const endBracket = trimmed.indexOf("]")
    if (endBracket > 1) {
      const candidate = trimmed.slice(1, endBracket)
      return isIP(candidate) ? candidate : null
    }
    return null
  }

  const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/)
  if (ipv4WithPort?.[1] && isIP(ipv4WithPort[1]) === 4) {
    return ipv4WithPort[1]
  }

  return isIP(trimmed) ? trimmed : null
}

function getHeaderValue(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name]
  return Array.isArray(value) ? value.join(",") : (value ?? null)
}

function firstValidIp(value: string | null) {
  if (!value) return null
  for (const candidate of value.split(",")) {
    const normalized = normalizeIpCandidate(candidate)
    if (normalized) return normalized
  }
  return null
}

export function getClientIp(headers: IncomingHttpHeaders) {
  const trustedIp = firstValidIp(getHeaderValue(headers, trustedIpHeader))
  if (trustedIp) return trustedIp

  if (process.env.NODE_ENV !== "production") {
    for (const headerName of localFallbackHeaders) {
      const ip = firstValidIp(getHeaderValue(headers, headerName))
      if (ip) return ip
    }
  }

  return "unknown"
}
