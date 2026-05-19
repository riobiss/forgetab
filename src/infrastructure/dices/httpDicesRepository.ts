import { apiFetch } from "@/infrastructure/http/apiFetch"
import type { DicesRepository } from "@/application/dices/ports/DicesRepository"
import type { DiceRollResponse } from "@/application/dices/types"

const GENERIC_DICE_ROLL_ERROR = "Nao foi possivel girar os dados agora. Tente novamente."

type ErrorPayload = {
  message?: string
}

export class DicesTechnicalError extends Error {}
export class DicesValidationError extends Error {}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    throw new DicesTechnicalError(GENERIC_DICE_ROLL_ERROR)
  }

  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    if (payload.message) {
      throw new DicesValidationError(payload.message)
    }

    throw new DicesTechnicalError(GENERIC_DICE_ROLL_ERROR)
  }

  return payload
}

export const httpDicesRepository: DicesRepository = {
  async roll(payload) {
    try {
      const response = await apiFetch("/api/dices/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return await parseJsonResponse<DiceRollResponse>(response)
    } catch (error) {
      if (error instanceof DicesTechnicalError || error instanceof DicesValidationError) {
        throw error
      }

      throw new DicesTechnicalError(GENERIC_DICE_ROLL_ERROR)
    }
  },
}
