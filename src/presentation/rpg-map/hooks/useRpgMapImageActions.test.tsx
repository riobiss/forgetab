import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useRpgMapImageActions } from "@/presentation/rpg-map/hooks/useRpgMapImageActions"

const mocks = vi.hoisted(() => ({
  uploadRpgMapImageUseCase: vi.fn(),
  persistRpgMapImageUseCase: vi.fn(),
  deleteRpgMapImageByUrlUseCase: vi.fn(),
}))

vi.mock("@/application/rpgMap/use-cases/rpgMap", () => ({
  uploadRpgMapImageUseCase: mocks.uploadRpgMapImageUseCase,
  persistRpgMapImageUseCase: mocks.persistRpgMapImageUseCase,
  deleteRpgMapImageByUrlUseCase: mocks.deleteRpgMapImageByUrlUseCase,
}))

describe("useRpgMapImageActions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("handleMapFile faz upload, persiste e atualiza mensagem", async () => {
    const setMapSrc = vi.fn()
    mocks.uploadRpgMapImageUseCase.mockResolvedValue({ url: "https://img.com/new-map.png" })
    mocks.persistRpgMapImageUseCase.mockResolvedValue({
      message: "Mapa atualizado com sucesso.",
      mapImage: "https://img.com/new-map.png",
    })

    const { result } = renderHook(() =>
      useRpgMapImageActions({
        rpgId: "rpg-1",
        isOwner: true,
        mapSrc: "https://img.com/current-map.png",
        setMapSrc,
      }),
    )

    const file = new File(["map"], "map.png", { type: "image/png" })

    await act(async () => {
      await result.current.handleMapFile(file)
    })

    expect(mocks.uploadRpgMapImageUseCase).toHaveBeenCalledTimes(1)
    expect(mocks.persistRpgMapImageUseCase).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      mapImage: "https://img.com/new-map.png",
    })
    expect(setMapSrc).toHaveBeenCalledWith("https://img.com/new-map.png")
    await waitFor(() => {
      expect(result.current.uploadMessage).toBe("Mapa atualizado com sucesso.")
    })
  })

  it("handleResetMapImage remove url, persiste null e volta para default", async () => {
    const setMapSrc = vi.fn()
    mocks.deleteRpgMapImageByUrlUseCase.mockResolvedValue({ message: "ok" })
    mocks.persistRpgMapImageUseCase.mockResolvedValue({
      message: "Mapa atualizado com sucesso.",
      mapImage: null,
    })

    const { result } = renderHook(() =>
      useRpgMapImageActions({
        rpgId: "rpg-1",
        isOwner: true,
        mapSrc: "https://img.com/current-map.png",
        setMapSrc,
      }),
    )

    await act(async () => {
      await result.current.handleResetMapImage()
    })

    expect(mocks.deleteRpgMapImageByUrlUseCase).toHaveBeenCalledWith(expect.anything(), {
      url: "https://img.com/current-map.png",
    })
    expect(mocks.persistRpgMapImageUseCase).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      mapImage: null,
    })
    expect(setMapSrc).toHaveBeenCalledWith("/map/world-map.png")
    await waitFor(() => {
      expect(result.current.uploadMessage).toBe("Imagem do mapa removida com sucesso.")
    })
  })
})
