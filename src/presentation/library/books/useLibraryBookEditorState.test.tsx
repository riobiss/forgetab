import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useLibraryBookEditorState } from "./useLibraryBookEditorState"

const mocks = vi.hoisted(() => ({
  loadLibraryBookUseCase: vi.fn(),
  createLibraryBookUseCase: vi.fn(),
  updateLibraryBookUseCase: vi.fn(),
  toastLoading: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  dismissToast: vi.fn(),
}))

vi.mock("@/application/library/use-cases/library", () => ({
  loadLibraryBookUseCase: mocks.loadLibraryBookUseCase,
  createLibraryBookUseCase: mocks.createLibraryBookUseCase,
  updateLibraryBookUseCase: mocks.updateLibraryBookUseCase,
}))

vi.mock("react-hot-toast", () => ({
  toast: {
    loading: mocks.toastLoading,
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

vi.mock("@/lib/toast", () => ({
  dismissToast: mocks.dismissToast,
}))

describe("useLibraryBookEditorState", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    mocks.toastLoading.mockReturnValue("toast-id")
  })

  it("mantem metadados do servidor ao restaurar draft local de um livro existente", async () => {
    const deps = { gateway: {} as never }

    mocks.loadLibraryBookUseCase.mockResolvedValue({
      book: {
        id: "book-1",
        rpgId: "rpg-1",
        sectionId: "section-1",
        title: "Titulo novo",
        description: "Descricao nova",
        visibility: "public",
        allowedCharacterIds: [],
        allowedClassKeys: [],
        allowedRaceKeys: [],
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Servidor" }] }] },
        createdAt: "2026-03-19T00:00:00.000Z",
        updatedAt: "2026-03-19T00:00:00.000Z",
      },
      canEdit: true,
      canManage: true,
    })

    window.localStorage.setItem(
      "forgetab:library-book-draft:rpg-1:section-1:book-1",
      JSON.stringify({
        title: "Titulo antigo",
        description: "Descricao antiga",
        visibility: "private",
        allowedCharacterIds: ["char-1"],
        allowedClassKeys: ["mage"],
        allowedRaceKeys: ["elf"],
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Local" }] }] },
      }),
    )

    const { result } = renderHook(() =>
      useLibraryBookEditorState({
        rpgId: "rpg-1",
        sectionId: "section-1",
        mode: "edit",
        bookId: "book-1",
        deps,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.draft.title).toBe("Titulo novo")
    expect(result.current.draft.description).toBe("Descricao nova")
    expect(result.current.draft.visibility).toBe("public")
    expect(result.current.draft.allowedCharacterIds).toEqual([])
    expect(result.current.pageTitle).toBe("Titulo novo")
    expect(result.current.draft.content).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Local" }] }],
    })
  })
})
