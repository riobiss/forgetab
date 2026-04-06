import type { FastifyRequest } from "fastify"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

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

function getCookieHeaderValue(cookieHeader: string | string[] | undefined) {
  if (Array.isArray(cookieHeader)) {
    return cookieHeader.join("; ")
  }
  return cookieHeader ?? null
}

function getBearerToken(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? null
}

export function getCookieValueFromRequest(request: Request, name: string) {
  const cookies = parseCookieHeader(request.headers.get("cookie"))
  return cookies.get(name) ?? null
}

export function getCookieValueFromFastifyRequest(request: FastifyRequest, name: string) {
  const cookies = parseCookieHeader(getCookieHeaderValue(request.headers.cookie))
  return cookies.get(name) ?? null
}

export async function getAuthPayloadFromRequest(request: Request) {
  const token =
    getBearerToken(request.headers.get("authorization")) ??
    getCookieValueFromRequest(request, TOKEN_COOKIE_NAME)
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

export async function getAuthPayloadFromFastifyRequest(request: FastifyRequest) {
  const authorizationHeader = Array.isArray(request.headers.authorization)
    ? request.headers.authorization[0]
    : request.headers.authorization
  const token =
    getBearerToken(authorizationHeader) ??
    getCookieValueFromFastifyRequest(request, TOKEN_COOKIE_NAME)
  if (!token) {
    return null
  }

  try {
    return await verifyAuthToken(token)
  } catch {
    return null
  }
}

export async function getUserIdFromFastifyRequest(request: FastifyRequest) {
  const payload = await getAuthPayloadFromFastifyRequest(request)
  return payload?.userId ?? null
}
