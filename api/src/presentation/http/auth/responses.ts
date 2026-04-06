import type { FastifyReply } from "fastify"
import { AuthRateLimitError } from "@/application/auth/errors/AuthRateLimitError"
import { AppError } from "@/shared/errors/AppError"
import { serializeCookie } from "@api/presentation/http/cookies"

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

export function writeAuthSuccessResponse(
  reply: FastifyReply,
  body: unknown,
  cookie: AuthCookie,
  options: { status?: number } = {},
) {
  reply.code(options.status ?? 200)
  reply.header("Content-Type", "application/json; charset=utf-8")
  reply.header("Set-Cookie", createAuthCookieHeader(cookie))
  return reply.send(body)
}

export function writeAuthErrorResponse(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof AuthRateLimitError) {
    reply.code(error.status)
    reply.header("Content-Type", "application/json; charset=utf-8")
    reply.header("Retry-After", String(error.retryAfterSeconds))
    return reply.send({ message: error.message })
  }

  if (error instanceof AppError) {
    reply.code(error.status)
    reply.header("Content-Type", "application/json; charset=utf-8")
    return reply.send({ message: error.message })
  }

  reply.code(500)
  reply.header("Content-Type", "application/json; charset=utf-8")
  return reply.send({ message: fallbackMessage })
}
