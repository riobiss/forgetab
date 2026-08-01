import { describe, expect, it, vi } from "vitest"
import type { LibraryAccessService } from "@/features/world/library/application/ports/LibraryAccessService"
import type { LibraryBookRepository } from "@/features/world/library/application/ports/LibraryRepository"
import { createLibraryBook } from "./libraryBooks"

describe("library book access", () => {
  it("permite ao autor criar livro na propria secao privada", async () => {
    const repository = {
      findSection: vi.fn().mockResolvedValue({
        id: "section-1",
        rpgId: "rpg-1",
        createdByUserId: "user-1",
        title: "Anotacoes",
        description: null,
        visibility: "private",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      createBook: vi.fn().mockResolvedValue({
        id: "book-1",
        sectionId: "section-1",
      }),
      touchSection: vi.fn().mockResolvedValue(undefined),
    } as unknown as LibraryBookRepository
    const accessService = {
      getRpgAccess: vi.fn().mockResolvedValue({
        exists: true,
        canView: true,
        canManage: false,
      }),
    } satisfies LibraryAccessService

    await expect(
      createLibraryBook(
        { repository, accessService },
        {
          rpgId: "rpg-1",
          sectionId: "section-1",
          userId: "user-1",
          body: {
            title: "Segredos",
            description: null,
            content: { type: "doc", content: [] },
            visibility: "private",
            allowedCharacterIds: [],
            allowedClassKeys: [],
            allowedRaceKeys: [],
          },
        },
      ),
    ).resolves.toEqual({ book: { id: "book-1", sectionId: "section-1" } })
    expect(repository.createBook).toHaveBeenCalledOnce()
    expect(repository.touchSection).toHaveBeenCalledWith("section-1")
  })
})
