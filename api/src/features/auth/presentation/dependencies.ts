import { prismaAuthRepository } from "@/features/auth/infrastructure/repositories/prismaAuthRepository"
import { bcryptAuthPasswordService } from "@/features/auth/infrastructure/services/bcryptAuthPasswordService"
import { jwtAuthTokenService } from "@/features/auth/infrastructure/services/jwtAuthTokenService"
import { rateLimitAuthService } from "@/features/auth/infrastructure/services/rateLimitAuthService"

export const authRouteDependencies = {
  authRepository: prismaAuthRepository,
  authPasswordService: bcryptAuthPasswordService,
  authTokenService: jwtAuthTokenService,
  authRateLimitService: rateLimitAuthService
} as const
