import { describe, expect, it } from "vitest"
import type { Note } from "@/features/world/notes/domain/Note"
import { serverNoteToLocal } from "./noteSync"

function serverNote(title: string): Note {
  return {
    id: "note-1",
    clientId: "client-1",
    title,
    content: "Conteúdo",
    labels: [],
    revision: 1,
    createdAt: "2026-08-19T10:00:00.000Z",
    updatedAt: "2026-08-19T10:00:00.000Z"
  }
}

describe("serverNoteToLocal", () => {
  it("remove o titulo artificial usado anteriormente em notas sem titulo", () => {
    expect(serverNoteToLocal(serverNote("Sem titulo")).title).toBe("")
  })

  it("preserva titulos informados pelo usuario", () => {
    expect(serverNoteToLocal(serverNote("Pistas")).title).toBe("Pistas")
  })
})
