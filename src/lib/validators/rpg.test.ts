import { describe, expect, it } from "vitest"
import { createRpgSchema } from "./rpg"

describe("createRpgSchema", () => {
  it("valida payload minimo correto", () => {
    const result = createRpgSchema.safeParse({
      title: "Campanha Alpha",
      description: "Descricao com tamanho minimo ok.",
      visibility: "private",
    })

    expect(result.success).toBe(true)
  })

  it("rejeita descricao curta", () => {
    const result = createRpgSchema.safeParse({
      title: "Campanha Alpha",
      description: "curta",
      visibility: "public",
    })

    expect(result.success).toBe(false)
  })

  it("rejeita image com URL invalida", () => {
    const result = createRpgSchema.safeParse({
      title: "Campanha Alpha",
      description: "Descricao com tamanho minimo ok.",
      visibility: "public",
      image: "nao-e-url",
    })

    expect(result.success).toBe(false)
  })

  it("rejeita descricao com mais de 400 caracteres", () => {
    const result = createRpgSchema.safeParse({
      title: "Campanha Alpha",
      description: "a".repeat(401),
      visibility: "public",
    })

    expect(result.success).toBe(false)
  })

  it("normaliza categorias de habilidade sem duplicacao", () => {
    const result = createRpgSchema.safeParse({
      title: "Campanha Alpha",
      description: "Descricao com tamanho minimo ok.",
      visibility: "public",
      abilityCategoriesEnabled: true,
      enabledAbilityCategories: ["fisicas", "magicas", "fisicas"],
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.enabledAbilityCategories).toEqual(["fisicas", "magicas"])
  })
})
