import type { DiceRollEntry, DiceRollResponse } from "@/application/dices/types"

export interface DicesRepository {
  roll(payload: { entries: DiceRollEntry[] }): Promise<DiceRollResponse>
}
