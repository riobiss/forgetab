import { describe, expect, it } from "vitest"
import {
  parseNoteLabelRequest,
  parseNotesLimit,
  parseSaveNoteRequest
} from "./requestParsers"

describe("notes request parsers", () => {
  it("mantem os valores padrao do contrato HTTP de notas", () => {
    expect(parseSaveNoteRequest({})).toEqual({
      title: "",
      content: "",
      labelIds: [],
      clientId: null,
      baseRevision: null
    })
  })

  it("filtra e remove duplicatas de identificadores de marcador", () => {
    expect(
      parseSaveNoteRequest({
        title: "Pistas",
        content: "Conteudo",
        labelIds: ["label-1", 2, "label-1", "label-2"],
        clientId: "client-1",
        baseRevision: 3
      })
    ).toEqual({
      title: "Pistas",
      content: "Conteudo",
      labelIds: ["label-1", "label-2"],
      clientId: "client-1",
      baseRevision: 3
    })
  })

  it("rejeita corpos que nao sejam objetos", () => {
    expect(() => parseSaveNoteRequest(null)).toThrow()
    expect(() => parseNoteLabelRequest("Marcador")).toThrow()
  })

  it("mantem limite invalido como ausente para o caso de uso usar o padrao", () => {
    expect(parseNotesLimit("30")).toBe(30)
    expect(parseNotesLimit("0")).toBeUndefined()
    expect(parseNotesLimit("texto")).toBeUndefined()
  })
})
