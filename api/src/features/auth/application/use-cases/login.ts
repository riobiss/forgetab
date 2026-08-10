import { loginSchema } from "@/features/auth/application/validation/authSchemas"
import { AuthRateLimitError } from "@/features/auth/application/errors/AuthRateLimitError"
import { AppError } from "@/features/shared/application/errors/AppError"
import type { AuthPasswordService } from "@/features/auth/application/ports/AuthPasswordService"
import type { AuthRateLimitService } from "@/features/auth/application/ports/AuthRateLimitService"
import type { AuthRepository } from "@/features/auth/application/ports/AuthRepository"
import type { AuthTokenService } from "@/features/auth/application/ports/AuthTokenService"

const LOGIN_RATE_LIMIT = {
  ipLimit: 20,
  emailPerIpLimit: 8,
  windowMs: 15 * 60 * 1000
}

export async function loginUseCase(
  input: {
    body: unknown
    clientIp: string
  },
  deps: {
    authRepository: AuthRepository
    authPasswordService: AuthPasswordService
    authTokenService: AuthTokenService
    authRateLimitService: AuthRateLimitService
  }
) {
  const ipRate = await deps.authRateLimitService.check(
    `login:ip:${input.clientIp}`,
    LOGIN_RATE_LIMIT.ipLimit,
    LOGIN_RATE_LIMIT.windowMs
  )

  if (!ipRate.allowed) {
    throw new AuthRateLimitError(
      "Muitas tentativas. Tente novamente em instantes.",
      ipRate.retryAfterSeconds
    )
  }

  const parsed = loginSchema.safeParse(input.body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400
    )
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()
  const emailRate = await deps.authRateLimitService.check(
    `login:email:${input.clientIp}:${normalizedEmail}`,
    LOGIN_RATE_LIMIT.emailPerIpLimit,
    LOGIN_RATE_LIMIT.windowMs
  )

  if (!emailRate.allowed) {
    throw new AuthRateLimitError(
      "Muitas tentativas. Tente novamente em instantes.",
      emailRate.retryAfterSeconds
    )
  }

  const user = await deps.authRepository.findUserByEmail(normalizedEmail)
  const isValidPassword = await deps.authPasswordService.verify(
    password,
    user?.passwordHash ?? null
  )
  if (!user || !isValidPassword) {
    throw new AppError("Credenciais invalidas.", 401)
  }

  const token = await deps.authTokenService.createToken({
    userId: user.id,
    email: user.email
  })

  return {
    token,
    cookie: deps.authTokenService.getCookieConfig(),
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  }
}
