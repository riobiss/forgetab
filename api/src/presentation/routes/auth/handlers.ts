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
import { parseJsonBody, writeJson } from "@api/presentation/http/fastifyJson"

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

    return writeAuthSuccessResponse(
      reply,
      { user: result.user, token: result.token, maxAge: result.cookie.maxAge },
      { ...result.cookie, value: result.token },
    )
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
      { user: result.user, token: result.token, maxAge: result.cookie.maxAge },
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
  return writeJson(reply, 200, { ok: true, service: "forgetab-api" })
}
