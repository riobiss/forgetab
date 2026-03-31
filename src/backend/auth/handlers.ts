import { loginUseCase } from "@/application/auth/use-cases/login"
import { logoutUseCase } from "@/application/auth/use-cases/logout"
import { registerUseCase } from "@/application/auth/use-cases/register"
import { prismaAuthRepository } from "@/infrastructure/auth/repositories/prismaAuthRepository"
import { bcryptAuthPasswordService } from "@/infrastructure/auth/services/bcryptAuthPasswordService"
import { jwtAuthTokenService } from "@/infrastructure/auth/services/jwtAuthTokenService"
import { rateLimitAuthService } from "@/infrastructure/auth/services/rateLimitAuthService"
import { createAuthSuccessResponse, toAuthErrorResponse } from "@/backend/auth/responses"
import { jsonResponse } from "@/backend/http/jsonResponse"

export async function loginHandler(request: Request) {
  try {
    const result = await loginUseCase(request, {
      authRepository: prismaAuthRepository,
      authPasswordService: bcryptAuthPasswordService,
      authTokenService: jwtAuthTokenService,
      authRateLimitService: rateLimitAuthService,
    })

    return createAuthSuccessResponse({ user: result.user }, { ...result.cookie, value: result.token })
  } catch (error) {
    return toAuthErrorResponse(error, "Erro interno ao autenticar usuario.")
  }
}

export async function registerHandler(request: Request) {
  try {
    const result = await registerUseCase(request, {
      authRepository: prismaAuthRepository,
      authPasswordService: bcryptAuthPasswordService,
      authTokenService: jwtAuthTokenService,
      authRateLimitService: rateLimitAuthService,
    })

    return createAuthSuccessResponse(
      { user: result.user },
      { ...result.cookie, value: result.token },
      { status: 201 },
    )
  } catch (error) {
    return toAuthErrorResponse(error, "Erro interno ao cadastrar usuario.")
  }
}

export async function logoutHandler() {
  const result = logoutUseCase(jwtAuthTokenService.getCookieConfig())

  return createAuthSuccessResponse(
    { ok: result.ok },
    {
      name: result.cookie.name,
      value: result.cookie.value,
      maxAge: result.cookie.maxAge,
    },
  )
}

export async function healthHandler() {
  return jsonResponse({ ok: true, service: "forgetab-api" })
}
