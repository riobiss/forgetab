import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import type { DicesRepository } from "@/features/dices/application/ports/DicesRepository"
import type { DiceRollResponse } from "@/features/dices/application/types"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

const GENERIC_DICE_ROLL_ERROR =
  "Nao foi possivel girar os dados agora. Tente novamente."

export class DicesTechnicalError extends Error {}
export class DicesValidationError extends Error {}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return parseApiResponse<T>(response, {
    fallbackMessage: GENERIC_DICE_ROLL_ERROR,
    invalidResponseMessage: GENERIC_DICE_ROLL_ERROR,
    errorFactory: (message) =>
      message === GENERIC_DICE_ROLL_ERROR
        ? new DicesTechnicalError(message)
        : new DicesValidationError(message)
  })
}

export const httpDicesRepository: DicesRepository = {
  async roll(payload) {
    try {
      const response = await apiFetch("/api/dices/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      return await parseJsonResponse<DiceRollResponse>(response)
    } catch (error) {
      if (
        error instanceof DicesTechnicalError ||
        error instanceof DicesValidationError
      ) {
        throw error
      }

      throw new DicesTechnicalError(GENERIC_DICE_ROLL_ERROR)
    }
  }
}
