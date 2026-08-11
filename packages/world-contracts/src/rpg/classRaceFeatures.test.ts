import { describe, expect, it } from "vitest"
import { resolveClassRaceFeatureFlags } from "./classRaceFeatures"

describe("resolveClassRaceFeatureFlags", () => {
  it("falls back to the legacy combined flag", () => {
    expect(
      resolveClassRaceFeatureFlags({ useClassRaceBonuses: true })
    ).toEqual({ useRaceBonuses: true, useClassBonuses: true })
  })

  it("gives precedence to each explicit feature flag", () => {
    expect(
      resolveClassRaceFeatureFlags({
        useClassRaceBonuses: true,
        useRaceBonuses: false,
        useClassBonuses: true
      })
    ).toEqual({ useRaceBonuses: false, useClassBonuses: true })
  })

  it("defaults absent settings to disabled", () => {
    expect(resolveClassRaceFeatureFlags(undefined)).toEqual({
      useRaceBonuses: false,
      useClassBonuses: false
    })
  })
})
