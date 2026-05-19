import type { DicesRepository } from "@/application/dices/ports/DicesRepository"
import { DicesTechnicalError } from "@/infrastructure/dices/httpDicesRepository"

type FallbackDicesRepositoryOptions = {
  isOffline?: () => boolean
}

export function createFallbackDicesRepository(
  primaryRepository: DicesRepository,
  fallbackRepository: DicesRepository,
  options: FallbackDicesRepositoryOptions = {},
): DicesRepository {
  return {
    async roll(payload) {
      if (options.isOffline?.()) {
        return fallbackRepository.roll(payload)
      }

      try {
        return await primaryRepository.roll(payload)
      } catch (error) {
        if (error instanceof DicesTechnicalError) {
          return fallbackRepository.roll(payload)
        }

        throw error
      }
    },
  }
}
