import { dicesRepository } from "@/features/dices/infrastructure/dicesRepository"

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `roll-${Date.now()}`
}

export const dicesPageDependencies = {
  dicesRepository,
  createHistoryId,
  now: () => new Date(),
} as const
