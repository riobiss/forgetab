import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useRpgMapSectionModalState } from "@/presentation/rpg-map/hooks/useRpgMapSectionModalState"

describe("useRpgMapSectionModalState", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("openEditSectionModal hidrata o formulario a partir da secao", () => {
    const { result } = renderHook(() => useRpgMapSectionModalState())

    act(() => {
      result.current.openEditSectionModal({
        id: "section-1",
        mapId: "map-1",
        rpgId: "rpg-1",
        parentSectionId: "parent-1",
        name: "Capital",
        description: "Centro do reino",
        type: "city",
        order: 0,
        customFields: {
          Sobre: "https://wiki.local/capital",
          MarcadorId: "marker-1",
          Clima: "Frio",
        },
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      })
    })

    expect(result.current.isSectionModalOpen).toBe(true)
    expect(result.current.editingSection?.id).toBe("section-1")
    expect(result.current.sectionForm).toMatchObject({
      name: "Capital",
      description: "Centro do reino",
      type: "city",
      parentSectionId: "parent-1",
      aboutLink: "https://wiki.local/capital",
      linkedMarkerId: "marker-1",
    })
    expect(result.current.sectionForm.customFields).toEqual([
      expect.objectContaining({
        name: "Clima",
        value: "Frio",
      }),
    ])
  })

  it("handleSaveCustomField valida chave reservada e adiciona novo campo valido", () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("field-123")

    const { result } = renderHook(() => useRpgMapSectionModalState())

    act(() => {
      result.current.openCreateSectionModal()
      result.current.openCustomFieldModal()
      result.current.setCustomFieldDraft(() => ({ key: "Sobre", value: "x" }))
    })

    act(() => {
      result.current.handleSaveCustomField()
    })

    expect(result.current.customFieldError).toBe("Essa chave ja e reservada pelo sistema.")
    expect(result.current.sectionForm.customFields).toEqual([])

    act(() => {
      result.current.setCustomFieldDraft(() => ({ key: "Clima", value: "Tropical" }))
    })

    act(() => {
      result.current.handleSaveCustomField()
    })

    expect(result.current.customFieldError).toBe("")
    expect(result.current.isCustomFieldModalOpen).toBe(false)
    expect(result.current.sectionForm.customFields).toEqual([
      {
        id: "field-123",
        name: "Clima",
        value: "Tropical",
      },
    ])
  })
})
