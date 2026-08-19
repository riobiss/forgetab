import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { SyncedNote as LocalNote } from "@/features/world/notes/application/models/SyncedNote"
import { MasonryNoteCard } from "./components/MasonryNoteCard"

const note: LocalNote = {
  id: "note-1",
  clientId: "client-1",
  localKey: "client:client-1",
  title: "Pistas",
  content: "Uma pista importante",
  labels: [],
  revision: 1,
  localVersion: 1,
  isNew: false,
  syncStatus: "saved",
  createdAt: "2026-08-19T10:00:00.000Z",
  updatedAt: "2026-08-19T10:00:00.000Z"
}

describe("MasonryNoteCard", () => {
  it("executa marcador, copia e exclusao pelo menu da previa", () => {
    const onAddLabel = vi.fn()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()

    render(
      <MasonryNoteCard
        note={note}
        menuDisabled={false}
        onOpen={vi.fn()}
        onAddLabel={onAddLabel}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    )

    const summary = screen.getByLabelText("Mais opções para Pistas")
    const details = summary.closest("details")
    expect(details?.open).toBe(false)

    fireEvent.click(summary)
    expect(details?.open).toBe(true)
    fireEvent.click(
      within(details as HTMLDetailsElement).getByRole("button", {
        name: /adicionar marcador/i
      })
    )
    expect(onAddLabel).toHaveBeenCalledOnce()
    expect(details?.open).toBe(false)

    fireEvent.click(summary)
    fireEvent.click(
      within(details as HTMLDetailsElement).getByRole("button", {
        name: /fazer uma cópia/i
      })
    )
    expect(onDuplicate).toHaveBeenCalledOnce()
    expect(details?.open).toBe(false)

    fireEvent.click(summary)
    fireEvent.click(
      within(details as HTMLDetailsElement).getByRole("button", {
        name: /excluir/i
      })
    )
    expect(onDelete).toHaveBeenCalledOnce()
    expect(details?.open).toBe(false)
  })

  it("nao renderiza heading quando a nota nao tem titulo", () => {
    render(
      <MasonryNoteCard
        note={{ ...note, title: "" }}
        menuDisabled={false}
        onOpen={vi.fn()}
        onAddLabel={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.queryByRole("heading")).toBeNull()
    expect(screen.getByText("Uma pista importante")).toBeInTheDocument()
  })
})
