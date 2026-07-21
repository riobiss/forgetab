import type { IncomingHttpHeaders } from "node:http"

const configuredFrontendUrl = process.env.FRONTEND_URL?.trim()

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "")
}

export function resolveAllowedOrigin(headers: IncomingHttpHeaders | Headers) {
  const origin = headers instanceof Headers
    ? headers.get("origin")?.trim()
    : (() => {
        const headerOrigin = headers.origin as string | string[] | undefined
        if (typeof headerOrigin === "string") {
          return headerOrigin.trim()
        }

        if (Array.isArray(headerOrigin)) {
          const firstOrigin = headerOrigin[0]
          return typeof firstOrigin === "string" ? firstOrigin.trim() : undefined
        }

        return undefined
      })()

  if (!origin) {
    return null
  }

  if (!configuredFrontendUrl) {
    return origin
  }

  return normalizeOrigin(origin) === normalizeOrigin(configuredFrontendUrl) ? origin : null
}
