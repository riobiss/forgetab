const configuredApiBaseUrl = normalizeConfiguredBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "https"
)
const configuredInternalApiBaseUrl = normalizeConfiguredBaseUrl(
  process.env.API_INTERNAL_BASE_URL,
  "http"
)

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function getImplicitProtocol(value: string, defaultProtocol: "http" | "https") {
  const host = value.split(/[/?#]/)[0]?.split(":")[0]?.toLowerCase()
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0"
    ? "http"
    : defaultProtocol
}

function normalizeConfiguredBaseUrl(
  value: string | undefined,
  defaultProtocol: "http" | "https"
) {
  const trimmedValue = value?.trim().replace(/\/+$/, "")
  if (!trimmedValue) {
    return undefined
  }

  if (isAbsoluteUrl(trimmedValue)) {
    return trimmedValue
  }

  const normalizedValue = trimmedValue.replace(/^\/+/, "")
  return `${getImplicitProtocol(normalizedValue, defaultProtocol)}://${normalizedValue}`
}

function ensureApiPath(path: string) {
  if (isAbsoluteUrl(path)) {
    throw new Error(`API path must not be an absolute URL: ${path}`)
  }

  if (!path.startsWith("/")) {
    throw new Error(`API path must start with "/": ${path}`)
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
    "API base URL nao configurada. Defina `NEXT_PUBLIC_API_BASE_URL` e, no server-side, opcionalmente `API_INTERNAL_BASE_URL`."
  )
}

export function buildApiUrl(path: string) {
  ensureApiPath(path)

  const baseUrl = getConfiguredApiBaseUrl()
  return `${baseUrl}${path}`
}

export async function resolveApiUrl(path: string) {
  return buildApiUrl(path)
}
