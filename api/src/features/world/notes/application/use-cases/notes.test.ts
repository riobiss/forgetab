import { describe, expect, it, vi } from "vitest"
import type { NoteLabelsRepository } from "../ports/NoteLabelsRepository"
import type { NotesAccessService } from "../ports/NotesAccessService"
import type { NotesCursorCodec } from "../ports/NotesCursorCodec"
import type { NotesRepository } from "../ports/NotesRepository"
import type { SaveNoteInput } from "../types"
import { createNoteLabel, updateNoteLabel } from "./noteLabels"
import { createNote, listNotes, updateNote } from "./notes"

function createDependencies(options?: {
  exists?: boolean
  canUseNotes?: boolean
}) {
  const noteRepository: NotesRepository = {
    list: vi.fn(async () => []),
    create: vi.fn(async (rpgId, userId, input) => ({
      id: "note-1",
      rpgId,
      userId,
      clientId: input.clientId,
      title: input.title,
      content: input.content,
      revision: 0,
      labels: [],
      createdAt: new Date("2026-08-18T12:00:00Z"),
      updatedAt: new Date("2026-08-18T12:00:00Z")
    })),
    update: vi.fn(async (rpgId, userId, noteId, input) => ({
      kind: "updated" as const,
      note: {
        id: noteId,
        rpgId,
        userId,
        clientId: input.clientId,
        title: input.title,
        content: input.content,
        revision: (input.baseRevision ?? 0) + 1,
        labels: [],
        createdAt: new Date("2026-08-18T12:00:00Z"),
        updatedAt: new Date("2026-08-18T12:01:00Z")
      }
    })),
    delete: vi.fn(async () => true)
  }
  const labelRepository: NoteLabelsRepository = {
    listLabels: vi.fn(async () => []),
    createLabel: vi.fn(async (_rpgId, _userId, name) => ({
      id: "label-1",
      name
    })),
    updateLabel: vi.fn(async (_rpgId, _userId, labelId, name) => ({
      id: labelId,
      name
    })),
    deleteLabel: vi.fn(async () => true)
  }
  const cursorCodec: NotesCursorCodec = {
    encode: (note) => `${note.updatedAt.toISOString()}|${note.id}`,
    decode: (value) => {
      const separator = value.lastIndexOf("|")
      return {
        updatedAt: new Date(value.slice(0, separator)),
        id: value.slice(separator + 1)
      }
    }
  }
  const accessService: NotesAccessService = {
    getCampaignAccess: vi.fn(async () => ({
      exists: options?.exists ?? true,
      canUseNotes: options?.canUseNotes ?? true
    }))
  }

  return { noteRepository, labelRepository, cursorCodec, accessService }
}

function noteInput(patch: Partial<SaveNoteInput> = {}): SaveNoteInput {
  return {
    title: "",
    content: "",
    labelIds: [],
    clientId: null,
    baseRevision: null,
    ...patch
  }
}

describe("notes use cases", () => {
  it("lista somente depois de validar o acesso a campanha", async () => {
    const dependencies = createDependencies()
    await expect(
      listNotes(dependencies, { rpgId: "rpg-1", userId: "user-1" })
    ).resolves.toEqual({ notes: [], nextCursor: null })
    expect(dependencies.accessService.getCampaignAccess).toHaveBeenCalledWith(
      "rpg-1",
      "user-1"
    )
    expect(dependencies.noteRepository.list).toHaveBeenCalledWith(
      "rpg-1",
      "user-1",
      { cursor: null, limit: 31, labelId: null }
    )
  })

  it("pagina notas com cursor opaco e filtro de marcador", async () => {
    const dependencies = createDependencies()
    const notes = Array.from({ length: 31 }, (_, index) => ({
      id: `note-${String(index).padStart(2, "0")}`,
      rpgId: "rpg-1",
      userId: "user-1",
      clientId: null,
      title: `Nota ${index}`,
      content: "Conteudo",
      revision: 0,
      labels: [],
      createdAt: new Date("2026-08-19T10:00:00.000Z"),
      updatedAt: new Date(Date.UTC(2026, 7, 19, 10, 0, 31 - index))
    }))
    vi.mocked(dependencies.noteRepository.list).mockResolvedValue(notes)

    const firstPage = await listNotes(dependencies, {
      rpgId: "rpg-1",
      userId: "user-1",
      limit: 30,
      labelId: "label-1"
    })

    expect(firstPage.notes).toHaveLength(30)
    expect(firstPage.nextCursor).toEqual(expect.any(String))
    expect(dependencies.noteRepository.list).toHaveBeenLastCalledWith(
      "rpg-1",
      "user-1",
      { cursor: null, limit: 31, labelId: "label-1" }
    )

    await listNotes(dependencies, {
      rpgId: "rpg-1",
      userId: "user-1",
      cursor: firstPage.nextCursor ?? undefined
    })
    expect(dependencies.noteRepository.list).toHaveBeenLastCalledWith(
      "rpg-1",
      "user-1",
      expect.objectContaining({
        cursor: {
          id: notes[29].id,
          updatedAt: notes[29].updatedAt
        },
        limit: 31
      })
    )
  })

  it("normaliza o titulo ao criar uma nota", async () => {
    const dependencies = createDependencies()
    await createNote(dependencies, {
      rpgId: "rpg-1",
      userId: "user-1",
      note: noteInput({ title: "  Pistas  ", content: "Conteudo" })
    })
    expect(dependencies.noteRepository.create).toHaveBeenCalledWith(
      "rpg-1",
      "user-1",
      {
        title: "Pistas",
        content: "Conteudo",
        labelIds: [],
        clientId: null,
        baseRevision: null
      }
    )
  })

  it("permite criar uma nota sem titulo quando existe conteudo", async () => {
    const dependencies = createDependencies()
    await createNote(dependencies, {
      rpgId: "rpg-1",
      userId: "user-1",
      note: noteInput({ content: "Conteudo sem titulo" })
    })

    expect(dependencies.noteRepository.create).toHaveBeenCalledWith(
      "rpg-1",
      "user-1",
      expect.objectContaining({ title: "", content: "Conteudo sem titulo" })
    )
  })

  it("rejeita uma nota totalmente vazia", async () => {
    const dependencies = createDependencies()

    await expect(
      createNote(dependencies, {
        rpgId: "rpg-1",
        userId: "user-1",
        note: noteInput({ content: "  " })
      })
    ).rejects.toMatchObject({ status: 400 })
    expect(dependencies.noteRepository.create).not.toHaveBeenCalled()
  })

  it("impede acesso de quem nao participa da campanha", async () => {
    const dependencies = createDependencies({ canUseNotes: false })
    await expect(
      updateNote(dependencies, {
        rpgId: "rpg-1",
        userId: "user-1",
        noteId: "note-1",
        note: noteInput({ title: "Pistas", content: "Conteudo" })
      })
    ).rejects.toMatchObject({ status: 403 })
    expect(dependencies.noteRepository.update).not.toHaveBeenCalled()
  })

  it("rejeita update baseado em uma revisao antiga", async () => {
    const dependencies = createDependencies()
    vi.mocked(dependencies.noteRepository.update).mockResolvedValue({
      kind: "conflict",
      note: {
        id: "note-1",
        rpgId: "rpg-1",
        userId: "user-1",
        clientId: "client-1",
        title: "Versao atual",
        content: "Servidor",
        revision: 3,
        labels: [],
        createdAt: new Date("2026-08-18T12:00:00Z"),
        updatedAt: new Date("2026-08-18T12:02:00Z")
      }
    })

    await expect(
      updateNote(dependencies, {
        rpgId: "rpg-1",
        userId: "user-1",
        noteId: "note-1",
        note: noteInput({
          title: "Versao antiga",
          content: "Local",
          baseRevision: 2
        })
      })
    ).rejects.toMatchObject({ status: 409 })
  })

  it("mantem conflito ao criar marcador com nome existente", async () => {
    const dependencies = createDependencies()
    vi.mocked(dependencies.labelRepository.createLabel).mockResolvedValue(null)

    await expect(
      createNoteLabel(dependencies, {
        rpgId: "rpg-1",
        userId: "user-1",
        name: "  Pistas  "
      })
    ).rejects.toMatchObject({ status: 409 })
    expect(dependencies.labelRepository.createLabel).toHaveBeenCalledWith(
      "rpg-1",
      "user-1",
      "Pistas"
    )
  })

  it("mantem a resposta anterior ao editar marcador inexistente ou duplicado", async () => {
    const dependencies = createDependencies()
    vi.mocked(dependencies.labelRepository.updateLabel).mockResolvedValue(null)

    await expect(
      updateNoteLabel(dependencies, {
        rpgId: "rpg-1",
        userId: "user-1",
        labelId: "label-1",
        name: "Pistas"
      })
    ).rejects.toMatchObject({
      status: 404,
      message: "Marcador nao encontrado ou nome duplicado."
    })
  })
})
