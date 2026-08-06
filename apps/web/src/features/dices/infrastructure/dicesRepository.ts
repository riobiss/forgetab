import { createFallbackDicesRepository } from "@/features/dices/infrastructure/fallbackDicesRepository"
import { httpDicesRepository } from "@/features/dices/infrastructure/httpDicesRepository"
import { localDicesRepository } from "@/features/dices/infrastructure/localDicesRepository"

function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false
}

export const dicesRepository = createFallbackDicesRepository(
  httpDicesRepository,
  localDicesRepository,
  { isOffline: isBrowserOffline }
)
