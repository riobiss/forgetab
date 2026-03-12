import { NextResponse } from "next/server"
import { AuthRateLimitError } from "@/application/auth/errors/AuthRateLimitError"
import { registerUseCase } from "@/application/auth/use-cases/register"
import { prismaAuthRepository } from "@/infrastructure/auth/repositories/prismaAuthRepository"
import { bcryptAuthPasswordService } from "@/infrastructure/auth/services/bcryptAuthPasswordService"
import { rateLimitAuthService } from "@/infrastructure/auth/services/rateLimitAuthService"
import { jwtAuthTokenService } from "@/infrastructure/auth/services/jwtAuthTokenService"
import { AppError } from "@/shared/errors/AppError"
import { toErrorResponse } from "@/presentation/api/auth/toErrorResponse"

export async function POST(request: Request) {
  try {
    const result = await registerUseCase(request, {
      authRepository: prismaAuthRepository,
      authPasswordService: bcryptAuthPasswordService,
      authTokenService: jwtAuthTokenService,
      authRateLimitService: rateLimitAuthService,
    })

    const response = NextResponse.json({ user: result.user }, { status: 201 })
    response.cookies.set({
      name: result.cookie.name,
      value: result.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: result.cookie.maxAge,
    })

    return response
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      return NextResponse.json(
        { message: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      )
    }
    if (error instanceof AppError && error.status === 429) {
      return NextResponse.json({ message: error.message }, { status: 429 })
    }
    return toErrorResponse(error, "Erro interno ao cadastrar usuario.")
  }
}
