import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { LibraryDependencies } from "@/features/world/library/application/contracts/LibraryDependencies"
import type {
  LibraryBookDto,
  LibrarySectionDto
} from "@/features/world/library/application/types"
import { useLibrarySectionBooksController } from "./useLibrarySectionBooksController"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}))

const section: LibrarySectionDto = {
  id: "section-1",
  rpgId: "rpg-1",
  title: "Historia",
  description: null,
  visibility: "public",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
}

const book: LibraryBookDto = {
  id: "book-1",
  rpgId: "rpg-1",
  sectionId: "section-1",
  title: "Cronicas do Norte",
  description: "Relatos antigos",
  content: { type: "doc", content: [] },
  canEdit: true,
  visibility: "private",
  allowedCharacterIds: ["user-1"],
  allowedClassKeys: ["mago"],
  allowedRaceKeys: ["elfo"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z"
}

function createDependencies(): LibraryDependencies {
  return {
    gateway: {
      fetchSections: vi.fn(),
      createSection: vi.fn(),
      updateSection: vi.fn(),
      deleteSection: vi.fn(),
      fetchSection: vi.fn().mockResolvedValue({ section, canManage: true }),
      fetchSectionBooks: vi.fn().mockResolvedValue({
        books: [book],
        canManage: true,
        canCreate: true
      }),
      fetchVisibilityOptions: vi.fn().mockResolvedValue({
        players: [{ id: "user-1", username: "ana", name: "Ana" }],
        races: [{ key: "elfo", label: "Elfo" }],
        classes: [{ key: "mago", label: "Mago" }]
      }),
      fetchBook: vi.fn(),
      createBook: vi.fn(),
      updateBook: vi.fn(),
      deleteBook: vi.fn(),
      uploadLibraryImage: vi.fn()
    }
  }
}

describe("useLibrarySectionBooksController", () => {
  it("carrega livros, permissoes e opcoes de visibilidade", async () => {
    const deps = createDependencies()
    const { result } = renderHook(() =>
      useLibrarySectionBooksController({
        rpgId: "rpg-1",
        sectionId: "section-1",
        deps
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.section?.title).toBe("Historia")
    expect(result.current.filteredBooks).toEqual([book])
    expect(result.current.canCreate).toBe(true)

    act(() => result.current.openEditModal(book))
    expect(result.current.editModal.isOpen).toBe(true)
    expect(result.current.editModal.selectedPlayerOptions).toEqual([
      { value: "user-1", label: "@ana - Ana" }
    ])
    expect(result.current.editModal.selectedRaceOptions[0]?.value).toBe("elfo")
    expect(result.current.editModal.selectedClassOptions[0]?.value).toBe("mago")
  })

  it("filtra livros e valida o titulo antes de criar", async () => {
    const deps = createDependencies()
    const { result } = renderHook(() =>
      useLibrarySectionBooksController({
        rpgId: "rpg-1",
        sectionId: "section-1",
        deps
      })
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setSearch("inexistente"))
    await waitFor(() => expect(result.current.filteredBooks).toEqual([]))

    act(() => result.current.openCreateModal())
    await act(async () => result.current.createModal.onCreate())
    expect(result.current.createModal.error).toBe(
      "Informe um nome com pelo menos 2 caracteres."
    )
    expect(deps.gateway.createBook).not.toHaveBeenCalled()
  })
})
