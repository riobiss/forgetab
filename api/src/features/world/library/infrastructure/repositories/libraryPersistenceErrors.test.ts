import { describe, expect, it } from "vitest"

import { LibraryRepositoryError } from "@/features/world/library/application/errors/LibraryRepositoryError"

import { toLibraryRepositoryError } from "./libraryPersistenceErrors"

describe("toLibraryRepositoryError", () => {
  it.each([
    'relation "rpg_library_sections" does not exist',
    'relation "rpg_library_books" does not exist',
    'column "allowed_character_ids" does not exist',
  ])("traduz erro de schema: %s", (message) => {
    const source = new Error(message)
    const result = toLibraryRepositoryError(source)

    expect(result).toBeInstanceOf(LibraryRepositoryError)
    expect(result.code).toBe("schema_outdated")
    expect(result.cause).toBe(source)
  })

  it("preserva erros tipados", () => {
    const source = new LibraryRepositoryError("unknown")

    expect(toLibraryRepositoryError(source)).toBe(source)
  })

  it("classifica falhas inesperadas como unknown", () => {
    expect(toLibraryRepositoryError(new Error("connection refused")).code).toBe(
      "unknown",
    )
  })
})
