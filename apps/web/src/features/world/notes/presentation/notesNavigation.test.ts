import { describe, expect, it } from "vitest"
import {
  createNotesHref,
  notesReturnPageLabel,
  resolveNotesReturnPath
} from "./notesNavigation"

describe("notesNavigation", () => {
  it("preserva uma pagina da mesma campanha no link de notas", () => {
    expect(createNotesHref("rpg-1", "/rpg/rpg-1/characters")).toBe(
      "/rpg/rpg-1/notes?returnTo=%2Frpg%2Frpg-1%2Fcharacters"
    )
    expect(notesReturnPageLabel("rpg-1", "/rpg/rpg-1/characters")).toBe(
      "Personagens"
    )
  })

  it("rejeita retornos externos, de outra campanha ou para notas", () => {
    expect(resolveNotesReturnPath("rpg-1", "https://example.com")).toBe(
      "/rpg/rpg-1"
    )
    expect(resolveNotesReturnPath("rpg-1", "/rpg/rpg-2/map")).toBe("/rpg/rpg-1")
    expect(resolveNotesReturnPath("rpg-1", "/rpg/rpg-1/notes")).toBe(
      "/rpg/rpg-1"
    )
  })
})
