import { fireEvent, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { MapSectionConflictModal } from "@/presentation/rpg-map/components/MapSectionConflictModal"

describe("MapSectionConflictModal", () => {
  it("renderiza os campos em conflito e dispara as acoes", () => {
    const onKeepMarker = vi.fn()
    const onKeepSection = vi.fn()
    const onGoToMap = vi.fn()
    const onClose = vi.fn()

    render(
      <MapSectionConflictModal
        isOpen
        modalRef={createRef<HTMLElement>()}
        pendingSectionConflict={{
          linkedMarker: { id: "marker-1" },
          fields: ["Nome", "Descricao"],
        }}
        saving={false}
        onKeepMarker={onKeepMarker}
        onKeepSection={onKeepSection}
        onGoToMap={onGoToMap}
        onClose={onClose}
      />,
    )

    expect(screen.getByText(/Nome, Descricao/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Manter marcador" }))
    fireEvent.click(screen.getByRole("button", { name: "Manter secao" }))
    fireEvent.click(screen.getByRole("button", { name: "Ir ao mapa" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onKeepMarker).toHaveBeenCalledTimes(1)
    expect(onKeepSection).toHaveBeenCalledTimes(1)
    expect(onGoToMap).toHaveBeenCalledWith("marker-1")
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
