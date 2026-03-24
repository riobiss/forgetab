import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useRpgMapPageModalFocus } from "@/presentation/rpg-map/hooks/useRpgMapPageModalFocus"

const mocks = vi.hoisted(() => ({
  useModalFocusTrap: vi.fn(),
}))

vi.mock("@/presentation/rpg-map/hooks/useModalFocusTrap", () => ({
  useModalFocusTrap: mocks.useModalFocusTrap,
}))

describe("useRpgMapPageModalFocus", () => {
  it("prioriza o modal de conflito quando existe conflito pendente", () => {
    const backgroundElement = document.createElement("div")
    const mapModalElement = document.createElement("section")
    const sectionModalElement = document.createElement("section")
    const sectionDetailsModalElement = document.createElement("section")
    const customFieldModalElement = document.createElement("section")
    const sectionConflictModalElement = document.createElement("section")
    const onEscape = vi.fn()

    renderHook(() =>
      useRpgMapPageModalFocus({
        backgroundElement,
        isMapModalOpen: true,
        mapModalElement,
        isSectionModalOpen: true,
        sectionModalElement,
        isSectionDetailsModalOpen: true,
        sectionDetailsModalElement,
        isCustomFieldModalOpen: true,
        customFieldModalElement,
        hasPendingSectionConflict: true,
        sectionConflictModalElement,
        onEscape,
      }),
    )

    expect(mocks.useModalFocusTrap).toHaveBeenCalledWith({
      activeElement: sectionConflictModalElement,
      backgroundElement,
      onEscape,
    })
  })

  it("usa o modal de detalhes quando ele e o modal mais prioritario aberto", () => {
    const backgroundElement = document.createElement("div")
    const sectionDetailsModalElement = document.createElement("section")
    const onEscape = vi.fn()

    renderHook(() =>
      useRpgMapPageModalFocus({
        backgroundElement,
        isMapModalOpen: true,
        mapModalElement: document.createElement("section"),
        isSectionModalOpen: false,
        sectionModalElement: null,
        isSectionDetailsModalOpen: true,
        sectionDetailsModalElement,
        isCustomFieldModalOpen: false,
        customFieldModalElement: null,
        hasPendingSectionConflict: false,
        sectionConflictModalElement: null,
        onEscape,
      }),
    )

    expect(mocks.useModalFocusTrap).toHaveBeenCalledWith({
      activeElement: sectionDetailsModalElement,
      backgroundElement,
      onEscape,
    })
  })
})
