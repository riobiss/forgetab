export type ClassRaceFeatureInput = {
  useRaceBonuses?: boolean | null
  useClassBonuses?: boolean | null
  useClassRaceBonuses?: boolean | null
}

export function resolveClassRaceFeatureFlags(
  input: ClassRaceFeatureInput | null | undefined
) {
  const legacyFlag = Boolean(input?.useClassRaceBonuses)
  return {
    useRaceBonuses:
      typeof input?.useRaceBonuses === "boolean"
        ? input.useRaceBonuses
        : legacyFlag,
    useClassBonuses:
      typeof input?.useClassBonuses === "boolean"
        ? input.useClassBonuses
        : legacyFlag
  }
}
