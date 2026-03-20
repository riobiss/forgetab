import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useRpgMapFormModalState } from "@/presentation/rpg-map/hooks/useRpgMapFormModalState"

describe("useRpgMapFormModalState", () => {
  it("openCreateMapModal reseta o formulario e abre o modal", () => {
    const { result } = renderHook(() => useRpgMapFormModalState())

    act(() => {
      result.current.openEditMapModal({
        id: "map-1",
        rpgId: "rpg-1",
        title: "Mapa antigo",
        description: "Descricao antiga",
        type: "kingdom",
        image: null,
        order: 0,
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      })
      result.current.setMapFormError("Erro antigo")
    })

    act(() => {
      result.current.openCreateMapModal()
    })

    expect(result.current.isMapModalOpen).toBe(true)
    expect(result.current.editingMap).toBeNull()
    expect(result.current.mapForm).toEqual({
      title: "",
      description: "",
      type: "",
    })
    expect(result.current.mapFormError).toBe("")
  })

  it("openEditMapModal hidrata os dados do mapa e closeMapModal fecha o modal", () => {
    const { result } = renderHook(() => useRpgMapFormModalState())

    act(() => {
      result.current.openEditMapModal({
        id: "map-1",
        rpgId: "rpg-1",
        title: "Mundo",
        description: "Descricao",
        type: "planet",
        image: "https://img.com/mapa.png",
        order: 1,
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      })
    })

    expect(result.current.isMapModalOpen).toBe(true)
    expect(result.current.editingMap?.id).toBe("map-1")
    expect(result.current.mapForm).toEqual({
      title: "Mundo",
      description: "Descricao",
      type: "planet",
    })

    act(() => {
      result.current.closeMapModal()
    })

    expect(result.current.isMapModalOpen).toBe(false)
  })
})
