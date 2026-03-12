import { registerSchema } from "@/lib/validators/auth"
import { AuthRateLimitError } from "@/application/auth/errors/AuthRateLimitError"
import { AppError } from "@/shared/errors/AppError"
import type { AuthPasswordService } from "@/application/auth/ports/AuthPasswordService"
import type { AuthRateLimitService } from "@/application/auth/ports/AuthRateLimitService"
import type { AuthRepository } from "@/application/auth/ports/AuthRepository"
import type { AuthTokenService } from "@/application/auth/ports/AuthTokenService"

const REGISTER_RATE_LIMIT = {
  ipLimit: 12,
  emailPerIpLimit: 4,
  windowMs: 60 * 60 * 1000,
}

const GENERIC_REGISTER_CONFLICT_MESSAGE =
  "Nao foi possivel concluir o cadastro com os dados informados."
const USERNAME_CONFLICT_MESSAGE = "Username ja esta em uso. Tente outro."

export async function registerUseCase(
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
    `register:ip:${clientIp}`,
    REGISTER_RATE_LIMIT.ipLimit,
    REGISTER_RATE_LIMIT.windowMs,
  )

  if (!ipRate.allowed) {
    throw new AuthRateLimitError(
      "Muitas tentativas. Tente novamente em instantes.",
      ipRate.retryAfterSeconds,
    )
  }

  const body = await request.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
  }

  const { name, username, email, password } = parsed.data
  const normalizedUsername = username.toLowerCase()
  const normalizedEmail = email.toLowerCase()

  const emailRate = await deps.authRateLimitService.check(
    `register:email:${clientIp}:${normalizedEmail}`,
    REGISTER_RATE_LIMIT.emailPerIpLimit,
    REGISTER_RATE_LIMIT.windowMs,
  )

  if (!emailRate.allowed) {
    throw new AuthRateLimitError(
      "Muitas tentativas. Tente novamente em instantes.",
      emailRate.retryAfterSeconds,
    )
  }

  const existingUser = await deps.authRepository.findUserByEmail(normalizedEmail)
  if (existingUser) {
    throw new AppError(GENERIC_REGISTER_CONFLICT_MESSAGE, 409)
  }

  const existingUsername = await deps.authRepository.findUserByUsername(
    normalizedUsername,
  )
  if (existingUsername) {
    throw new AppError(USERNAME_CONFLICT_MESSAGE, 409)
  }

  const passwordHash = await deps.authPasswordService.hash(password)
  const user = await deps.authRepository.createUser({
    name,
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
  })
  const token = await deps.authTokenService.createToken({
    userId: user.id,
    email: user.email,
  })

  return {
    token,
    cookie: deps.authTokenService.getCookieConfig(),
    user,
  }
}
