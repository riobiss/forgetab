import type { FastifyReply, FastifyRequest } from "fastify"
import { loginUseCase } from "@/features/auth/application/use-cases/login"
import { logoutUseCase } from "@/features/auth/application/use-cases/logout"
import { registerUseCase } from "@/features/auth/application/use-cases/register"
import { authRouteDependencies } from "@/features/auth/presentation/dependencies"
import {
  writeAuthErrorResponse,
  writeAuthSuccessResponse
} from "@/features/http/presentation/auth/responses"
import { parseJsonBody } from "@/features/http/presentation/fastifyJson"
import { getClientIp } from "@/features/http/presentation/clientIp"

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await loginUseCase(
      {
        body: parseJsonBody(request.body),
        clientIp: getClientIp(request.headers)
      },
      authRouteDependencies
    )

    return writeAuthSuccessResponse(
      reply,
      { user: result.user, token: result.token, maxAge: result.cookie.maxAge },
      { ...result.cookie, value: result.token }
    )
  } catch (error) {
    return writeAuthErrorResponse(
      reply,
      error,
      "Erro interno ao autenticar usuario."
    )
  }
}

export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await registerUseCase(
      {
        body: parseJsonBody(request.body),
        clientIp: getClientIp(request.headers)
      },
      authRouteDependencies
    )

    return writeAuthSuccessResponse(
      reply,
      { user: result.user, token: result.token, maxAge: result.cookie.maxAge },
      { ...result.cookie, value: result.token },
      { status: 201 }
    )
  } catch (error) {
    return writeAuthErrorResponse(
      reply,
      error,
      "Erro interno ao cadastrar usuario."
    )
  }
}

export async function logoutHandler(reply: FastifyReply) {
  const result = logoutUseCase(
    authRouteDependencies.authTokenService.getCookieConfig()
  )

  return writeAuthSuccessResponse(
    reply,
    { ok: result.ok },
    {
      name: result.cookie.name,
      value: result.cookie.value,
      maxAge: result.cookie.maxAge
    }
  )
}
