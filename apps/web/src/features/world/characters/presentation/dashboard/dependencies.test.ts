import { describe, expect, it } from "vitest"
import { createCharacterDetailModalDependencies } from "@/features/world/characters/presentation/dashboard/dependencies"

describe("character detail modal dependencies", () => {
  it("creates HTTP adapters outside the presentation component", () => {
    const dependencies = createCharacterDetailModalDependencies()

    expect(dependencies.loadout.gateway.fetchInventory).toBeTypeOf("function")
    expect(
      dependencies.createAbilities("rpg-1").gateway.removeAbility,
    ).toBeTypeOf("function")
  })
})
