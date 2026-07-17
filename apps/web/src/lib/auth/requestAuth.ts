import { TOKEN_COOKIE_NAME } from "@/lib/auth/constants"
import { verifyAuthToken } from "@/lib/auth/token"

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return new Map<string, string>()
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=")
        if (separatorIndex < 0) {
          return [part, ""]
        }

        const name = part.slice(0, separatorIndex).trim()
        const value = part.slice(separatorIndex + 1).trim()
        return [name, decodeURIComponent(value)]
      }),
  )
}

export function getCookieValueFromRequest(request: Request, name: string) {
  const cookies = parseCookieHeader(request.headers.get("cookie"))
  return cookies.get(name) ?? null
}

export async function getAuthPayloadFromRequest(request: Request) {
  const token = getCookieValueFromRequest(request, TOKEN_COOKIE_NAME)
  if (!token) {
    return null
  }

  try {
    return await verifyAuthToken(token)
  } catch {
    return null
  }
}

export async function getUserIdFromRequest(request: Request) {
  const payload = await getAuthPayloadFromRequest(request)
  return payload?.userId ?? null
}
