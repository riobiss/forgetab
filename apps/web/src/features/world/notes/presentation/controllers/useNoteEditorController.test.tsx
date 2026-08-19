import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { SyncedNote as LocalNote } from "@/features/world/notes/application/models/SyncedNote"
import { useNoteEditorController } from "./useNoteEditorController"

function localNote(patch: Partial<LocalNote> = {}): LocalNote {
  return {
    id: "note-1",
    clientId: "client-1",
    localKey: "client:client-1",
    title: "Pistas",
    content: "Uma pista",
    labels: [],
    revision: 1,
    localVersion: 1,
    isNew: false,
    syncStatus: "saved",
    createdAt: "2026-08-19T10:00:00.000Z",
    updatedAt: "2026-08-19T10:00:00.000Z",
    ...patch
  }
}

function syncCommands() {
  return {
    flush: vi.fn(),
    createDraft: vi.fn(() => "client:new"),
    updateLocal: vi.fn(),
    remove: vi.fn(async () => undefined)
  }
}

describe("useNoteEditorController", () => {
  it("coordena abertura, edicao, copia e exclusao da nota", async () => {
    const note = localNote()
    const sync = syncCommands()
    const { result } = renderHook(() =>
      useNoteEditorController({ notes: [note], sync })
    )

    act(() => result.current.openEditor(note))
    expect(result.current.note).toEqual(note)

    act(() => result.current.updateEditor({ content: "Nova pista" }))
    expect(sync.updateLocal).toHaveBeenCalledWith(note.localKey, {
      content: "Nova pista"
    })

    act(() => result.current.duplicateEditorNote())
    expect(sync.createDraft).toHaveBeenCalledWith({
      title: "Pistas (copia)",
      content: note.content,
      labels: []
    })

    await act(async () => result.current.deleteNote(note))
    expect(sync.remove).toHaveBeenCalledWith(note.localKey)
    expect(result.current.note).toBeNull()
  })

  it("impede salvar uma nota vazia", () => {
    const note = localNote({ title: "", content: "" })
    const sync = syncCommands()
    const { result } = renderHook(() =>
      useNoteEditorController({ notes: [note], sync })
    )

    act(() => result.current.openEditor(note))
    act(() => result.current.saveEditor())

    expect(sync.flush).not.toHaveBeenCalled()
    expect(result.current.error).toBe(
      "Escreva um titulo ou conteudo para salvar a nota."
    )
  })
})
