import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { NoteLabelsGateway } from "@/features/world/notes/application/contracts/NotesGateway"
import { createNoteLabelsService } from "@/features/world/notes/application/services/NoteLabelsService"
import { useLabelsController } from "./useLabelsController"

function labelGateway() {
  return {
    listLabels: vi.fn(async () => [{ id: "label-1", name: "Lore" }]),
    createLabel: vi.fn(async () => ({ id: "label-2", name: "NPCs" })),
    updateLabel: vi.fn(async () => ({ id: "label-1", name: "História" })),
    deleteLabel: vi.fn(async () => undefined)
  } satisfies NoteLabelsGateway
}

describe("useLabelsController", () => {
  afterEach(() => vi.restoreAllMocks())

  it("carrega e coordena criacao, edicao e exclusao de marcadores", async () => {
    const gateway = labelGateway()
    const noteMetadata = {
      replaceLabelMetadata: vi.fn(),
      removeLabelMetadata: vi.fn()
    }
    const service = createNoteLabelsService(gateway)
    const { result } = renderHook(() =>
      useLabelsController({
        rpgId: "rpg-1",
        service,
        noteMetadata
      })
    )

    await waitFor(() => expect(result.current.labels).toHaveLength(1))

    act(() => result.current.setNewLabelName("NPCs"))
    await act(async () => result.current.createLabel())
    expect(gateway.createLabel).toHaveBeenCalledWith("rpg-1", "NPCs")
    expect(result.current.labels.map((label) => label.name)).toEqual([
      "Lore",
      "NPCs"
    ])

    act(() => {
      result.current.startEditing({ id: "label-1", name: "Lore" })
      result.current.setEditingLabelName("História")
    })
    await act(async () => result.current.renameLabel())
    expect(noteMetadata.replaceLabelMetadata).toHaveBeenCalledWith({
      id: "label-1",
      name: "História"
    })

    act(() =>
      result.current.requestDeleteLabel({
        id: "label-1",
        name: "História"
      })
    )
    expect(result.current.labelPendingDeletion?.id).toBe("label-1")

    await act(async () => result.current.confirmDeleteLabel())
    expect(gateway.deleteLabel).toHaveBeenCalledWith("rpg-1", "label-1")
    expect(noteMetadata.removeLabelMetadata).toHaveBeenCalledWith("label-1")
    expect(result.current.labelPendingDeletion).toBeNull()
  })

  it("permite cancelar a exclusao sem chamar o gateway", async () => {
    const gateway = labelGateway()
    const noteMetadata = {
      replaceLabelMetadata: vi.fn(),
      removeLabelMetadata: vi.fn()
    }
    const service = createNoteLabelsService(gateway)
    const { result } = renderHook(() =>
      useLabelsController({
        rpgId: "rpg-1",
        service,
        noteMetadata
      })
    )

    await waitFor(() => expect(result.current.labels).toHaveLength(1))

    act(() => {
      result.current.requestDeleteLabel(result.current.labels[0])
      result.current.cancelDeleteLabel()
    })

    expect(result.current.labelPendingDeletion).toBeNull()
    expect(gateway.deleteLabel).not.toHaveBeenCalled()
  })
})
