import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { CharacterStatusCurrentDependencies } from "@/features/world/characters/application/status-current/contracts/CharacterStatusCurrentGateway"
import StatusTracker from "./StatusTracker"

function createDependencies(
  update: CharacterStatusCurrentDependencies["gateway"]["update"]
): CharacterStatusCurrentDependencies {
  return { gateway: { update } }
}

const defaultProps = {
  items: [{ key: "life", label: "Vida", max: 10, current: 8 }],
  rpgId: "rpg-1",
  characterId: "character-1",
  canPersist: true
}

describe("StatusTracker", () => {
  it("persiste a alteracao em currentStatuses e exibe o valor confirmado", async () => {
    const update = vi.fn().mockResolvedValue({
      message: "Status atual salvo.",
      key: "life",
      value: 7,
      max: 10
    })
    const getItem = vi.spyOn(Storage.prototype, "getItem")
    const setItem = vi.spyOn(Storage.prototype, "setItem")

    render(
      <StatusTracker
        {...defaultProps}
        dependencies={createDependencies(update)}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "-" }))

    expect(update).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      characterId: "character-1",
      key: "life",
      value: 7
    })
    await waitFor(() => {
      expect(screen.getByText("Vida: 7/10")).toBeInTheDocument()
    })
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()

    getItem.mockRestore()
    setItem.mockRestore()
  })

  it("restaura o valor anterior quando a persistencia falha", async () => {
    const update = vi.fn().mockRejectedValue(new Error("Falha ao salvar."))

    render(
      <StatusTracker
        {...defaultProps}
        dependencies={createDependencies(update)}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "+" }))

    await waitFor(() => {
      expect(screen.getByText("Vida: 8/10")).toBeInTheDocument()
      expect(screen.getByRole("alert")).toHaveTextContent("Falha ao salvar.")
    })
  })

  it("nao permite alterar o status sem permissao de edicao", () => {
    const update = vi.fn()

    render(
      <StatusTracker
        {...defaultProps}
        canPersist={false}
        dependencies={createDependencies(update)}
      />
    )

    expect(screen.getByRole("button", { name: "-" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "+" })).toBeDisabled()
    expect(update).not.toHaveBeenCalled()
  })
})
