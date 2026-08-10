import { describe, expect, it } from "vitest"
import slugify from "./slugify"

describe("slugify", () => {
  it("remove acentos e normaliza para kebab-case", () => {
    expect(slugify("Olá Mundo RPG")).toBe("ola-mundo-rpg")
  })

  it("remove simbolos e tracos sobrando nas pontas", () => {
    expect(slugify("  ***Ficha #1***  ")).toBe("ficha-1")
  })
})
