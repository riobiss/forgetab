import type { DicesRepository } from "@/application/dices/ports/DicesRepository"
import type { DiceRollEntry, DiceRollGroup } from "@/application/dices/types"

function rollEntry(entry: DiceRollEntry, random: () => number): DiceRollGroup {
  const results = Array.from(
    { length: entry.diceCount },
    () => Math.floor(random() * entry.diceSides) + 1,
  )

  return {
    ...entry,
    results,
    total: results.reduce((sum, value) => sum + value, 0),
  }
}

export function createLocalDicesRepository(random: () => number = Math.random): DicesRepository {
  return {
    async roll(payload) {
      return {
        provider: "local",
        groups: payload.entries.map((entry) => rollEntry(entry, random)),
      }
    },
  }
}

export const localDicesRepository = createLocalDicesRepository()
