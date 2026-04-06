import { buildApiUrl } from "@/infrastructure/http/backendUrls"
import { TOKEN_COOKIE_NAME } from "@/lib/auth/constants"
import { getClientAuthToken } from "@/infrastructure/auth/session/clientAuthSession"

export { buildApiUrl } from "@/infrastructure/http/backendUrls"

async function getServerAuthToken() {
  if (typeof window !== "undefined") {
    return null
  }

  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    return cookieStore.get(TOKEN_COOKIE_NAME)?.value ?? null
  } catch {
    return null
  }
}

async function buildAuthHeaders(headers: HeadersInit | undefined) {
  const nextHeaders = new Headers(headers)
  if (nextHeaders.has("Authorization")) {
    return nextHeaders
  }

  const token =
    typeof window === "undefined"
      ? await getServerAuthToken()
      : getClientAuthToken()

  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`)
  }

  return nextHeaders
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = await buildAuthHeaders(init.headers)

  return fetch(buildApiUrl(path), {
    ...init,
    credentials: init.credentials ?? "include",
    headers,
  })
}
