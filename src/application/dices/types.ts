export const DICE_ROLL_MAX_COUNT = 100
export const DICE_ROLL_MAX_SIDES = 1000
export const PRESET_DICE_SIDES = [2, 4, 6, 8, 10, 12, 20, 100]

export type DiceRollEntry = {
  diceCount: number
  diceSides: number
}

export type DiceRollGroup = DiceRollEntry & {
  results: number[]
  total: number
}

export type DiceRollResponse = {
  provider?: "local" | "random-org"
  groups: DiceRollGroup[]
}

export type RollHistoryItem = {
  id: string
  provider: "local" | "random-org"
  groups: DiceRollGroup[]
  diceTotal: number
  modifier: number
  total: number
  rolledAt: Date
}

export type StoredRollHistoryItem = Omit<RollHistoryItem, "rolledAt"> & {
  rolledAt: string
}

export type DicesStorageState = {
  diceCount: string
  diceSides: string
  modifier: string
  customSides: number[]
  history: StoredRollHistoryItem[]
}

export type DiceRollResultItem = {
  value: number
  diceSides: number
}

export type DiceRollStats = {
  max: number
  min: number
  highCount: number
  lowCount: number
  average: number
}
