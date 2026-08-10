import type { IncomingHttpHeaders } from "node:http"

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "")
}

function getConfiguredOrigins() {
  return (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean)
}

function isLocalDevelopmentOrigin(origin: string) {
  if (process.env.NODE_ENV === "production") return false

  try {
    const { hostname } = new URL(origin)
    return ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(hostname)
  } catch {
    return false
  }
}

export function resolveAllowedOrigin(headers: IncomingHttpHeaders | Headers) {
  const origin =
    headers instanceof Headers
      ? headers.get("origin")?.trim()
      : (() => {
          const headerOrigin = headers.origin as string | string[] | undefined
          if (typeof headerOrigin === "string") {
            return headerOrigin.trim()
          }

          if (Array.isArray(headerOrigin)) {
            const firstOrigin = headerOrigin[0]
            return typeof firstOrigin === "string"
              ? firstOrigin.trim()
              : undefined
          }

          return undefined
        })()

  if (!origin) {
    return null
  }

  const normalizedOrigin = normalizeOrigin(origin)
  if (getConfiguredOrigins().includes(normalizedOrigin)) {
    return origin
  }

  return isLocalDevelopmentOrigin(origin) ? origin : null
}
