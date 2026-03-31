import { AuthRateLimitError } from "@/application/auth/errors/AuthRateLimitError"
import { AppError } from "@/shared/errors/AppError"
import { serializeCookie } from "@/backend/http/cookies"
import { jsonResponse } from "@/backend/http/jsonResponse"

type AuthCookie = {
  name: string
  value: string
  maxAge: number
}

function createAuthCookieHeader(cookie: AuthCookie) {
  return serializeCookie(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookie.maxAge,
  })
}

export function createAuthSuccessResponse(
  body: unknown,
  cookie: AuthCookie,
  init: ResponseInit = {},
) {
  const response = jsonResponse(body, init)
  response.headers.set("Set-Cookie", createAuthCookieHeader(cookie))
  return response
}

export function toAuthErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthRateLimitError) {
    return jsonResponse(
      { message: error.message },
      {
        status: error.status,
        headers: { "Retry-After": String(error.retryAfterSeconds) },
      },
    )
  }

  if (error instanceof AppError) {
    return jsonResponse({ message: error.message }, { status: error.status })
  }

  return jsonResponse({ message: fallbackMessage }, { status: 500 })
}
