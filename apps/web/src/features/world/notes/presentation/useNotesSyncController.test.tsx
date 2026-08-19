import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NotesGateway } from "@/features/world/notes/application/contracts/NotesGateway"
import { createNotesSyncService } from "@/features/world/notes/application/services/NotesSyncService"
import { notesCacheRepository } from "@/features/world/notes/infrastructure/storage/notesCacheRepository"
import type { Note } from "@/features/world/notes/domain/Note"
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_SAFETY_INTERVAL_MS,
  useNotesSyncController
} from "./useNotesSyncController"

function persistedNote(content: string, clientId: string): Note {
  return {
    id: "note-1",
    clientId,
    title: "Pistas",
    content,
    labels: [],
    revision: 0,
    createdAt: "2026-08-19T10:00:00.000Z",
    updatedAt: "2026-08-19T10:00:01.000Z"
  }
}

function createGateway() {
  const gateway: NotesGateway = {
    list: vi.fn(async () => ({ notes: [], nextCursor: null })),
    create: vi.fn(async (_rpgId, payload) =>
      persistedNote(payload.content, payload.clientId ?? "client-1")
    ),
    update: vi.fn(async (_rpgId, _noteId, payload) => ({
      ...persistedNote(payload.content, payload.clientId ?? "client-1"),
      revision: (payload.baseRevision ?? 0) + 1
    })),
    delete: vi.fn(async () => undefined)
  }
  return gateway
}

const legacySource = { load: () => [] }
const services = new WeakMap<
  NotesGateway,
  ReturnType<typeof createNotesSyncService>
>()

function syncService(gateway: NotesGateway) {
  const existing = services.get(gateway)
  if (existing) return existing
  const service = createNotesSyncService({
    gateway,
    cache: notesCacheRepository,
    legacySource
  })
  services.set(gateway, service)
  return service
}

async function settleLoad() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe("useNotesSyncController", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true
    })
  })

  afterEach(() => vi.useRealTimers())

  it("salva somente depois de 700 ms sem novas alteracoes", async () => {
    const gateway = createGateway()
    const { result } = renderHook(() =>
      useNotesSyncController({
        rpgId: "rpg-1",
        userId: "user-1",
        service: syncService(gateway)
      })
    )
    await settleLoad()

    let localKey = ""
    act(() => {
      localKey = result.current.createDraft({ title: "Pistas" })
      result.current.updateLocal(localKey, { content: "Nova pista" })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS - 1)
    })
    expect(gateway.create).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(gateway.create).toHaveBeenCalledTimes(1)
  })

  it("nao deixa uma resposta antiga sobrescrever texto mais recente", async () => {
    let resolveCreate!: (note: Note) => void
    const gateway = createGateway()
    vi.mocked(gateway.create).mockImplementation(
      (_rpgId, payload) =>
        new Promise((resolve) => {
          resolveCreate = () =>
            resolve(
              persistedNote(payload.content, payload.clientId ?? "client-1")
            )
        })
    )
    const { result } = renderHook(() =>
      useNotesSyncController({
        rpgId: "rpg-1",
        userId: "user-1",
        service: syncService(gateway)
      })
    )
    await settleLoad()

    let localKey = ""
    act(() => {
      localKey = result.current.createDraft({ title: "Pistas" })
      result.current.updateLocal(localKey, { content: "Versao A" })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS)
    })
    act(() => result.current.updateLocal(localKey, { content: "Versao B" }))
    await act(async () => resolveCreate(persistedNote("Versao A", "client-1")))

    expect(
      result.current.notes.find((note) => note.localKey === localKey)?.content
    ).toBe("Versao B")
    expect(
      result.current.notes.find((note) => note.localKey === localKey)
        ?.syncStatus
    ).toBe("pending")
  })

  it("sincroniza em 5 segundos mesmo com digitacao continua", async () => {
    const gateway = createGateway()
    const { result } = renderHook(() =>
      useNotesSyncController({
        rpgId: "rpg-1",
        userId: "user-1",
        service: syncService(gateway)
      })
    )
    await settleLoad()

    let localKey = ""
    act(() => {
      localKey = result.current.createDraft({ title: "Diario" })
    })
    for (let index = 0; index < AUTOSAVE_SAFETY_INTERVAL_MS / 500; index += 1) {
      await act(async () => vi.advanceTimersByTimeAsync(500))
      act(() =>
        result.current.updateLocal(localKey, { content: `Texto ${index}` })
      )
    }

    expect(gateway.create).toHaveBeenCalledTimes(1)
  })

  it("mantem a nota offline e tenta novamente quando a conexao volta", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false
    })
    const gateway = createGateway()
    const { result } = renderHook(() =>
      useNotesSyncController({
        rpgId: "rpg-1",
        userId: "user-1",
        service: syncService(gateway)
      })
    )
    await settleLoad()

    let localKey = ""
    act(() => {
      localKey = result.current.createDraft({ title: "Offline" })
      result.current.updateLocal(localKey, { content: "Sem conexao" })
    })
    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS))
    expect(gateway.create).not.toHaveBeenCalled()
    expect(result.current.notes[0]?.syncStatus).toBe("offline")

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true
    })
    await act(async () => {
      window.dispatchEvent(new Event("online"))
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(gateway.create).toHaveBeenCalledTimes(1)
  })

  it("nao repete erro HTTP permanente ate existir uma nova edicao", async () => {
    const gateway = createGateway()
    vi.mocked(gateway.create).mockRejectedValue({ status: 400 })
    const { result } = renderHook(() =>
      useNotesSyncController({
        rpgId: "rpg-1",
        userId: "user-1",
        service: syncService(gateway)
      })
    )
    await settleLoad()

    let localKey = ""
    act(() => {
      localKey = result.current.createDraft({
        title: "Invalida",
        content: "Conteudo"
      })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS)
      await vi.advanceTimersByTimeAsync(AUTOSAVE_SAFETY_INTERVAL_MS * 2)
    })
    expect(gateway.create).toHaveBeenCalledTimes(1)

    act(() => result.current.updateLocal(localKey, { content: "Corrigida" }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS)
    })
    expect(gateway.create).toHaveBeenCalledTimes(2)
  })

  it("carrega paginas seguintes sem duplicar a requisicao", async () => {
    const gateway = createGateway()
    vi.mocked(gateway.list)
      .mockResolvedValueOnce({ notes: [], nextCursor: "cursor-2" })
      .mockResolvedValueOnce({ notes: [], nextCursor: null })
    const { result } = renderHook(() =>
      useNotesSyncController({
        rpgId: "rpg-1",
        userId: "user-1",
        service: syncService(gateway)
      })
    )
    await settleLoad()

    await act(async () => {
      result.current.loadMore()
      result.current.loadMore()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(gateway.list).toHaveBeenCalledTimes(2)
    expect(gateway.list).toHaveBeenLastCalledWith("rpg-1", {
      cursor: "cursor-2",
      limit: 30,
      labelId: null
    })
    expect(result.current.hasMore).toBe(false)
  })

  it("reinicia a paginacao no servidor ao selecionar marcador", async () => {
    const gateway = createGateway()
    const { result } = renderHook(() =>
      useNotesSyncController({
        rpgId: "rpg-1",
        userId: "user-1",
        service: syncService(gateway)
      })
    )
    await settleLoad()

    await act(async () => {
      result.current.setListFilter("label-1")
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(gateway.list).toHaveBeenLastCalledWith("rpg-1", {
      cursor: null,
      limit: 30,
      labelId: "label-1"
    })
  })
})
