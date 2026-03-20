import { fireEvent, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { MapSectionCustomFieldModal } from "@/presentation/rpg-map/components/MapSectionCustomFieldModal"

describe("MapSectionCustomFieldModal", () => {
  it("encaminha alteracoes do rascunho e chama salvar/cancelar", () => {
    let draftState = { key: "", value: "" }
    const onChangeDraft = vi.fn((updater: (current: typeof draftState) => typeof draftState) => {
      draftState = updater(draftState)
    })
    const onSave = vi.fn()
    const onClose = vi.fn()

    render(
      <MapSectionCustomFieldModal
        isOpen
        modalRef={createRef<HTMLElement>()}
        customFieldKeyInputRef={createRef<HTMLInputElement>()}
        draft={{ key: "", value: "" }}
        error="Campo invalido"
        onChangeDraft={onChangeDraft}
        onSave={onSave}
        onClose={onClose}
      />,
    )

    fireEvent.change(screen.getByLabelText("Chave"), { target: { value: "Clima" } })
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "Frio" } })
    expect(draftState).toEqual({ key: "Clima", value: "Frio" })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.getByText("Campo invalido")).toBeInTheDocument()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
