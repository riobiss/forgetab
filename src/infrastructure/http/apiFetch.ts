const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "")
const configuredInternalApiBaseUrl = process.env.API_INTERNAL_BASE_URL?.trim().replace(/\/+$/, "")

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export function buildApiUrl(path: string) {
  if (isAbsoluteUrl(path)) {
    return path
  }

  if (!path.startsWith("/")) {
    throw new Error(`API path must start with "/": ${path}`)
  }

  const baseUrl =
    typeof window === "undefined" && configuredInternalApiBaseUrl
      ? configuredInternalApiBaseUrl
      : configuredApiBaseUrl

  return baseUrl ? `${baseUrl}${path}` : path
}

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(buildApiUrl(path), {
    credentials: init.credentials ?? "include",
    ...init,
  })
}
