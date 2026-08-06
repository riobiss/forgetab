import { describe, expect, it } from "vitest"
import {
  clampCharacterCurrentStatuses,
  resolveCharacterTextRecord,
  validateCharacterCoreStatuses
} from "@/features/world/character/application/use-cases/characterUpdateRules"

describe("characterUpdateRules", () => {
  it("clamps current statuses when their maximum changes", () => {
    expect(
      clampCharacterCurrentStatuses(
        { life: 15, mana: -2, sanity: 4.9 },
        { life: 10, mana: 8, sanity: 7, stamina: 5 }
      )
    ).toEqual({
      life: 10,
      mana: 0,
      sanity: 4,
      stamina: 5
    })
  })

  it("normalizes non-object text records", () => {
    expect(resolveCharacterTextRecord(null)).toEqual({})
    expect(resolveCharacterTextRecord(["invalid"])).toEqual({})
    expect(resolveCharacterTextRecord({ title: "Mage" })).toEqual({
      title: "Mage"
    })
  })

  it("resolves core status values", () => {
    expect(
      validateCharacterCoreStatuses({
        life: 10,
        defense: 3,
        mana: 7,
        exhaustion: 2,
        sanity: 5
      })
    ).toEqual({
      life: 10,
      defense: 3,
      mana: 7,
      exhaustion: 2,
      sanity: 5
    })
  })

  it("rejects invalid core status values with an application error", () => {
    expect(() =>
      validateCharacterCoreStatuses({
        life: -1,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0
      })
    ).toThrow(
      expect.objectContaining({
        name: "AppError",
        status: 400
      })
    )
  })
})
