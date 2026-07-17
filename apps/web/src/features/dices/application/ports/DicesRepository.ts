import type {
  DiceRollEntry,
  DiceRollResponse,
} from "@/features/dices/application/types"

export interface DicesRepository {
  roll(payload: { entries: DiceRollEntry[] }): Promise<DiceRollResponse>
}
