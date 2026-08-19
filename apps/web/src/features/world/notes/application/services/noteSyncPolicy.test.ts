import { describe, expect, it } from "vitest"
import type { SyncedNote } from "@/features/world/notes/application/models/SyncedNote"
import type { Note } from "@/features/world/notes/domain/Note"
import {
  isRetryableSyncFailure,
  mergeInitialNotes,
  sortNotesByLastUpdate
} from "./noteSyncPolicy"

function localNote(patch: Partial<SyncedNote> = {}): SyncedNote {
  return {
    id: "note-1",
    clientId: "client-1",
    localKey: "client:client-1",
    title: "Local",
    content: "Conteudo local",
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

function serverNote(patch: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    clientId: "client-1",
    title: "Servidor",
    content: "Conteudo do servidor",
    labels: [],
    revision: 2,
    createdAt: "2026-08-19T10:00:00.000Z",
    updatedAt: "2026-08-19T11:00:00.000Z",
    ...patch
  }
}

describe("note sync policy", () => {
  it("preserva uma alteracao local pendente ao mesclar a resposta inicial", () => {
    const pending = localNote({ syncStatus: "pending" })

    expect(mergeInitialNotes([serverNote()], [pending], [])[0]).toMatchObject({
      title: "Local",
      content: "Conteudo local",
      id: "note-1",
      revision: 2,
      syncStatus: "pending"
    })
  })

  it("ordena notas pela ultima edicao, das novas para as antigas", () => {
    const older = localNote({ id: "older", updatedAt: "2026-08-19T09:00:00Z" })
    const newer = localNote({ id: "newer", updatedAt: "2026-08-19T12:00:00Z" })

    expect(
      sortNotesByLastUpdate([older, newer]).map((note) => note.id)
    ).toEqual(["newer", "older"])
  })

  it("repete somente falhas temporarias ou sem status HTTP", () => {
    expect(isRetryableSyncFailure(new Error("Falha de rede"))).toBe(true)
    expect(isRetryableSyncFailure({ status: 429 })).toBe(true)
    expect(isRetryableSyncFailure({ status: 503 })).toBe(true)
    expect(isRetryableSyncFailure({ status: 400 })).toBe(false)
    expect(isRetryableSyncFailure({ status: 409 })).toBe(false)
  })
})
