import { loginSchema } from "@/lib/validators/auth"
import { AuthRateLimitError } from "@/application/auth/errors/AuthRateLimitError"
import { AppError } from "@/shared/errors/AppError"
import type { AuthPasswordService } from "@/application/auth/ports/AuthPasswordService"
import type { AuthRateLimitService } from "@/application/auth/ports/AuthRateLimitService"
import type { AuthRepository } from "@/application/auth/ports/AuthRepository"
import type { AuthTokenService } from "@/application/auth/ports/AuthTokenService"

const LOGIN_RATE_LIMIT = {
  ipLimit: 20,
  emailPerIpLimit: 8,
  windowMs: 15 * 60 * 1000,
}

export async function loginUseCase(
  request: Request,
  deps: {
    authRepository: AuthRepository
    authPasswordService: AuthPasswordService
    authTokenService: AuthTokenService
    authRateLimitService: AuthRateLimitService
  },
) {
  const clientIp = deps.authRateLimitService.getClientIp(request)
  const ipRate = await deps.authRateLimitService.check(
    `login:ip:${clientIp}`,
    LOGIN_RATE_LIMIT.ipLimit,
    LOGIN_RATE_LIMIT.windowMs,
  )

  if (!ipRate.allowed) {
    throw new AuthRateLimitError(
      "Muitas tentativas. Tente novamente em instantes.",
      ipRate.retryAfterSeconds,
    )
  }

  const body = await request.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()
  const emailRate = await deps.authRateLimitService.check(
    `login:email:${clientIp}:${normalizedEmail}`,
    LOGIN_RATE_LIMIT.emailPerIpLimit,
    LOGIN_RATE_LIMIT.windowMs,
  )

  if (!emailRate.allowed) {
    throw new AuthRateLimitError(
      "Muitas tentativas. Tente novamente em instantes.",
      emailRate.retryAfterSeconds,
    )
  }

  const user = await deps.authRepository.findUserByEmail(normalizedEmail)
  if (!user) {
    throw new AppError("Credenciais invalidas.", 401)
  }

  const isValidPassword = await deps.authPasswordService.compare(
    password,
    user.passwordHash,
  )
  if (!isValidPassword) {
    throw new AppError("Credenciais invalidas.", 401)
  }

  const token = await deps.authTokenService.createToken({
    userId: user.id,
    email: user.email,
  })

  return {
    token,
    cookie: deps.authTokenService.getCookieConfig(),
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  }
}
