import { describe, expect, it } from "vitest"
import { base64NotesCursorCodec } from "./base64NotesCursorCodec"

describe("base64NotesCursorCodec", () => {
  it("preserva data e id ao codificar e decodificar o cursor", () => {
    const cursor = {
      updatedAt: new Date("2026-08-19T12:30:00.000Z"),
      id: "note-1"
    }

    expect(
      base64NotesCursorCodec.decode(base64NotesCursorCodec.encode(cursor))
    ).toEqual(cursor)
  })

  it("rejeita cursores invalidos com erro de requisicao", () => {
    expect(() => base64NotesCursorCodec.decode("cursor-invalido")).toThrow()
  })
})
