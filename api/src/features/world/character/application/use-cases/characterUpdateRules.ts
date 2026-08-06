import { AppError } from "@/features/shared/application/errors/AppError"
import { validateStat } from "@/features/world/character/application/validators"

function fail(message: string): never {
  throw new AppError(message, 400)
}

export function clampCharacterCurrentStatuses(
  currentStatuses: unknown,
  nextStatuses: Record<string, number>
) {
  const currentStatusesRecord =
    currentStatuses &&
    typeof currentStatuses === "object" &&
    !Array.isArray(currentStatuses)
      ? (currentStatuses as Record<string, unknown>)
      : {}

  return Object.entries(nextStatuses).reduce<Record<string, number>>(
    (acc, [key, maxValue]) => {
      const rawCurrent = currentStatusesRecord[key]
      const currentNumber =
        typeof rawCurrent === "number" && Number.isFinite(rawCurrent)
          ? Math.floor(rawCurrent)
          : Math.floor(maxValue)
      acc[key] = Math.max(0, Math.min(Math.floor(maxValue), currentNumber))
      return acc
    },
    {}
  )
}

export function resolveCharacterTextRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function validateCharacterCoreStatuses(
  statuses: Record<string, number>
) {
  const life = validateStat("vida", statuses.life ?? 0)
  if (!life.ok) fail(life.message)
  const defense = validateStat("defesa", statuses.defense ?? 0)
  if (!defense.ok) fail(defense.message)
  const mana = validateStat("mana", statuses.mana ?? 0)
  if (!mana.ok) fail(mana.message)
  const exhaustion = validateStat("exaustão", statuses.exhaustion ?? 0)
  if (!exhaustion.ok) fail(exhaustion.message)
  const sanity = validateStat("sanidade", statuses.sanity ?? 0)
  if (!sanity.ok) fail(sanity.message)

  return {
    life: life.value,
    defense: defense.value,
    mana: mana.value,
    exhaustion: exhaustion.value,
    sanity: sanity.value
  }
}
