import { describe, expect, it } from "vitest"
import { buildSearchText, matchesSearch, normalizeSearchText } from "./search"

describe("search", () => {
  it("normaliza acentos, caixa, pontuacao e espacos", () => {
    expect(normalizeSearchText("  Pré-Requisito: AÇÃO!  ")).toBe(
      "pre requisito acao"
    )
  })

  it("monta um indice com valores opcionais e numericos", () => {
    expect(buildSearchText(["Espada Élfica", null, 2, undefined])).toBe(
      "espada elfica 2"
    )
  })

  it("encontra todos os termos mesmo fora da ordem original", () => {
    expect(matchesSearch(["Bola de Fogo", "Evocação"], "evocacao bola")).toBe(
      true
    )
    expect(matchesSearch("Bola de Fogo", "gelo bola")).toBe(false)
  })

  it("considera uma consulta vazia como correspondencia", () => {
    expect(matchesSearch("qualquer valor", "   ")).toBe(true)
  })
})
