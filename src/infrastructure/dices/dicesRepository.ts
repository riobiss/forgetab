import { createFallbackDicesRepository } from "@/infrastructure/dices/fallbackDicesRepository"
import { httpDicesRepository } from "@/infrastructure/dices/httpDicesRepository"
import { localDicesRepository } from "@/infrastructure/dices/localDicesRepository"

function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false
}

export const dicesRepository = createFallbackDicesRepository(
  httpDicesRepository,
  localDicesRepository,
  { isOffline: isBrowserOffline },
)
