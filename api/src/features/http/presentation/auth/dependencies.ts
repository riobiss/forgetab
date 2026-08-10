import { jwtAuthTokenService } from "@/features/auth/infrastructure/services/jwtAuthTokenService"

export const authRequestDependencies = {
  tokenService: jwtAuthTokenService
} as const
