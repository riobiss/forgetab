import { describe, expect, it } from "vitest"
import { createLibraryBookSchema, createLibrarySectionSchema } from "./library"

describe("createLibrarySectionSchema", () => {
  it("valida secao com dados corretos", () => {
    const result = createLibrarySectionSchema.safeParse({
      title: "Historia",
      description: "Contexto da campanha",
    })

    expect(result.success).toBe(true)
  })

  it("rejeita titulo curto", () => {
    const result = createLibrarySectionSchema.safeParse({
      title: "A",
    })

    expect(result.success).toBe(false)
  })
})

describe("createLibraryBookSchema", () => {
  it("aplica defaults de visibilidade e listas permitidas", () => {
    const result = createLibraryBookSchema.parse({
      title: "Livro 1",
      content: { type: "doc", content: [] },
    })

    expect(result.visibility).toBe("private")
    expect(result.allowedCharacterIds).toEqual([])
    expect(result.allowedClassKeys).toEqual([])
    expect(result.allowedRaceKeys).toEqual([])
  })

  it("aceita a visibilidade unlisted", () => {
    const result = createLibraryBookSchema.parse({
      title: "Livro por link",
      content: { type: "doc", content: [] },
      visibility: "unlisted",
    })

    expect(result.visibility).toBe("unlisted")
  })
})
