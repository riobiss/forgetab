import type { FastifyReply, FastifyRequest } from "fastify"
import { loginUseCase } from "@/application/auth/use-cases/login"
import { logoutUseCase } from "@/application/auth/use-cases/logout"
import { registerUseCase } from "@/application/auth/use-cases/register"
import { prismaAuthRepository } from "@/infrastructure/auth/repositories/prismaAuthRepository"
import { bcryptAuthPasswordService } from "@/infrastructure/auth/services/bcryptAuthPasswordService"
import { jwtAuthTokenService } from "@/infrastructure/auth/services/jwtAuthTokenService"
import { rateLimitAuthService } from "@/infrastructure/auth/services/rateLimitAuthService"
import {
  writeAuthErrorResponse,
  writeAuthSuccessResponse,
} from "@api/presentation/http/auth/responses"

function parseJsonBody(body: unknown) {
  if (body == null) {
    return null
  }

  if (Buffer.isBuffer(body)) {
    const raw = body.toString("utf8").trim()
    return raw ? JSON.parse(raw) : null
  }

  if (typeof body === "string") {
    const raw = body.trim()
    return raw ? JSON.parse(raw) : null
  }

  return body
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await loginUseCase(
      {
        body: parseJsonBody(request.body),
        clientIp: rateLimitAuthService.getClientIp(request.headers),
      },
      {
      authRepository: prismaAuthRepository,
      authPasswordService: bcryptAuthPasswordService,
      authTokenService: jwtAuthTokenService,
      authRateLimitService: rateLimitAuthService,
      },
    )

    return writeAuthSuccessResponse(reply, { user: result.user }, { ...result.cookie, value: result.token })
  } catch (error) {
    return writeAuthErrorResponse(reply, error, "Erro interno ao autenticar usuario.")
  }
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await registerUseCase(
      {
        body: parseJsonBody(request.body),
        clientIp: rateLimitAuthService.getClientIp(request.headers),
      },
      {
      authRepository: prismaAuthRepository,
      authPasswordService: bcryptAuthPasswordService,
      authTokenService: jwtAuthTokenService,
      authRateLimitService: rateLimitAuthService,
      },
    )

    return writeAuthSuccessResponse(
      reply,
      { user: result.user },
      { ...result.cookie, value: result.token },
      { status: 201 },
    )
  } catch (error) {
    return writeAuthErrorResponse(reply, error, "Erro interno ao cadastrar usuario.")
  }
}

export async function logoutHandler(reply: FastifyReply) {
  const result = logoutUseCase(jwtAuthTokenService.getCookieConfig())

  return writeAuthSuccessResponse(
    reply,
    { ok: result.ok },
    {
      name: result.cookie.name,
      value: result.cookie.value,
      maxAge: result.cookie.maxAge,
    },
  )
}

export async function healthHandler(reply: FastifyReply) {
  reply.code(200)
  reply.header("Content-Type", "application/json; charset=utf-8")
  return reply.send({ ok: true, service: "forgetab-api" })
}
