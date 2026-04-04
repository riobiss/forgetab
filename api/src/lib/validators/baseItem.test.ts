import { describe, expect, it } from "vitest"
import { createBaseItemSchema } from "./baseItem"

describe("createBaseItemSchema", () => {
  it("valida item base minimo", () => {
    const result = createBaseItemSchema.safeParse({
      name: "Espada Longa",
      type: "equipment",
      rarity: "common",
    })

    expect(result.success).toBe(true)
  })

  it("rejeita tipo invalido", () => {
    const result = createBaseItemSchema.safeParse({
      name: "Item X",
      type: "invalid",
      rarity: "common",
    })

    expect(result.success).toBe(false)
  })

  it("rejeita peso negativo", () => {
    const result = createBaseItemSchema.safeParse({
      name: "Armadura",
      type: "equipment",
      rarity: "rare",
      weight: -1,
    })

    expect(result.success).toBe(false)
  })
})
