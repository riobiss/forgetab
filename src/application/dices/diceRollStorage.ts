import {
  DICE_ROLL_MAX_SIDES,
  type DicesStorageState,
} from "@/application/dices/types"

export const DICES_STORAGE_KEY = "forgetab:dices"

export function parseDicesStorageState(value: string | null): DicesStorageState | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<DicesStorageState>
    if (typeof parsed.diceCount !== "string" || typeof parsed.diceSides !== "string") {
      return null
    }

    return {
      diceCount: parsed.diceCount,
      diceSides: parsed.diceSides,
      modifier: typeof parsed.modifier === "string" ? parsed.modifier : "0",
      customSides: Array.isArray(parsed.customSides)
        ? parsed.customSides.filter((side) => Number.isInteger(side) && side >= 2 && side <= DICE_ROLL_MAX_SIDES)
        : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return null
  }
}
