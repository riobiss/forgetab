const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "")
const configuredInternalApiBaseUrl = process.env.API_INTERNAL_BASE_URL?.trim().replace(/\/+$/, "")
const configuredRealtimeBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL?.trim().replace(/\/+$/, "")

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function isAbsoluteRealtimeUrl(value: string) {
  return /^wss?:\/\//i.test(value)
}

function ensureAbsolutePath(path: string, label: string) {
  if (!path.startsWith("/")) {
    throw new Error(`${label} must start with "/": ${path}`)
  }
}

export function getConfiguredApiBaseUrl() {
  return typeof window === "undefined" && configuredInternalApiBaseUrl
    ? configuredInternalApiBaseUrl
    : configuredApiBaseUrl
}

export function buildApiUrl(path: string) {
  if (isAbsoluteUrl(path)) {
    return path
  }

  ensureAbsolutePath(path, "API path")

  const baseUrl = getConfiguredApiBaseUrl()
  return baseUrl ? `${baseUrl}${path}` : path
}

function toRealtimeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://")
}

export function getConfiguredRealtimeBaseUrl() {
  if (configuredRealtimeBaseUrl) {
    return configuredRealtimeBaseUrl
  }

  const apiBaseUrl = getConfiguredApiBaseUrl()
  return apiBaseUrl ? toRealtimeBaseUrl(apiBaseUrl) : ""
}

export function buildRealtimeUrl(path = "/ws") {
  if (isAbsoluteRealtimeUrl(path)) {
    return path
  }

  ensureAbsolutePath(path, "Realtime path")

  const baseUrl = getConfiguredRealtimeBaseUrl()
  return baseUrl ? `${baseUrl}${path}` : path
}
