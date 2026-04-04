const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "")
const configuredInternalApiBaseUrl = process.env.API_INTERNAL_BASE_URL?.trim().replace(/\/+$/, "")

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function ensureAbsolutePath(path: string, label: string) {
  if (!path.startsWith("/")) {
    throw new Error(`${label} must start with "/": ${path}`)
  }
}

export function getConfiguredApiBaseUrl() {
  const explicitBaseUrl =
    typeof window === "undefined" && configuredInternalApiBaseUrl
      ? configuredInternalApiBaseUrl
      : configuredApiBaseUrl

  if (explicitBaseUrl) {
    return explicitBaseUrl
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:4000"
  }

  throw new Error(
    'API base URL nao configurada. Defina `NEXT_PUBLIC_API_BASE_URL` e, no server-side, opcionalmente `API_INTERNAL_BASE_URL`.',
  )
}

export function buildApiUrl(path: string) {
  if (isAbsoluteUrl(path)) {
    return path
  }

  ensureAbsolutePath(path, "API path")

  const baseUrl = getConfiguredApiBaseUrl()
  return baseUrl ? `${baseUrl}${path}` : path
}
