import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromFastifyRequest: vi.fn(),
  listNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  listNoteLabels: vi.fn(),
  createNoteLabel: vi.fn(),
  updateNoteLabel: vi.fn(),
  deleteNoteLabel: vi.fn()
}))

vi.mock("@/features/http/presentation/auth/requestAuth", () => ({
  getUserIdFromFastifyRequest: mocks.getUserIdFromFastifyRequest
}))

vi.mock("@/features/world/notes/application/use-cases/notes", () => ({
  listNotes: mocks.listNotes,
  createNote: mocks.createNote,
  updateNote: mocks.updateNote,
  deleteNote: mocks.deleteNote
}))

vi.mock("@/features/world/notes/application/use-cases/noteLabels", () => ({
  listNoteLabels: mocks.listNoteLabels,
  createNoteLabel: mocks.createNoteLabel,
  updateNoteLabel: mocks.updateNoteLabel,
  deleteNoteLabel: mocks.deleteNoteLabel
}))

import { buildApiServer } from "@api/app"

describe("notes routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromFastifyRequest.mockResolvedValue("user-1")
  })

  afterEach(async () => {
    if (!server) return
    await server.close()
    server = null
  })

  it("encaminha cursor, limite e marcador ao listar notas", async () => {
    server = buildApiServer()
    mocks.listNotes.mockResolvedValue({ notes: [], nextCursor: "cursor-2" })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/notes?cursor=cursor-1&limit=30&labelId=label-1"
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.listNotes).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
      cursor: "cursor-1",
      limit: 30,
      labelId: "label-1"
    })
    expect(response.json()).toEqual({ notes: [], nextCursor: "cursor-2" })
  })

  it("normaliza o contrato HTTP antes de criar a nota", async () => {
    server = buildApiServer()
    mocks.createNote.mockResolvedValue({ note: { id: "note-1" } })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/notes",
      payload: {
        title: "Pistas",
        content: "Conteudo",
        labelIds: ["label-1", 2, "label-1"],
        clientId: "client-1",
        baseRevision: 0
      }
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createNote).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
      note: {
        title: "Pistas",
        content: "Conteudo",
        labelIds: ["label-1"],
        clientId: "client-1",
        baseRevision: 0
      }
    })
  })

  it("protege as rotas quando nao existe usuario autenticado", async () => {
    server = buildApiServer()
    mocks.getUserIdFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/notes/note-1"
    })

    expect(response.statusCode).toBe(401)
    expect(mocks.deleteNote).not.toHaveBeenCalled()
  })
})
