import { fireEvent, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { MapFormModal } from "@/presentation/rpg-map/components/MapFormModal"

describe("MapFormModal", () => {
  it("renderiza formulario e encaminha atualizacao dos campos", () => {
    let nextState = { title: "", description: "", type: "" }
    const onChangeForm = vi.fn((updater: (current: typeof nextState) => typeof nextState) => {
      nextState = updater(nextState)
    })

    render(
      <MapFormModal
        isOpen
        modalRef={createRef<HTMLElement>()}
        editingMap={null}
        mapForm={{ title: "", description: "", type: "" }}
        mapFormError=""
        saving={false}
        onChangeForm={onChangeForm}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Novo mapa" } })
    expect(nextState).toEqual({
      title: "Novo mapa",
      description: "",
      type: "",
    })
  })

  it("aciona salvar e cancelar pelos botoes", () => {
    const onSave = vi.fn()
    const onClose = vi.fn()

    render(
      <MapFormModal
        isOpen
        modalRef={createRef<HTMLElement>()}
        editingMap={null}
        mapForm={{ title: "Mapa", description: "", type: "" }}
        mapFormError="Erro"
        saving={false}
        onChangeForm={vi.fn()}
        onSave={onSave}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.getByText("Erro")).toBeInTheDocument()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
