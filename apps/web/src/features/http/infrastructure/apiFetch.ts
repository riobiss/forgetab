import { resolveApiUrl } from "@/features/http/infrastructure/backendUrls"
import { getBrowserAuthToken } from "@/features/session/infrastructure/services/browserAuthSession"

async function getServerAuthToken() {
  if (typeof window !== "undefined") {
    return null
  }

  try {
    const { getServerAuthToken } =
      await import("@/features/session/infrastructure/services/cookieCurrentUserSessionService")
    return getServerAuthToken()
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
      : getBrowserAuthToken()

  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`)
  }

  return nextHeaders
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = await buildAuthHeaders(init.headers)
  const url = await resolveApiUrl(path)

  try {
    return await fetch(url, {
      ...init,
      credentials: init.credentials ?? "include",
      headers
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Falha ao conectar com a API em ${url}. Verifique \`NEXT_PUBLIC_API_BASE_URL\`/\`API_INTERNAL_BASE_URL\` e se a API separada esta rodando.`,
        { cause: error }
      )
    }

    throw error
  }
}
