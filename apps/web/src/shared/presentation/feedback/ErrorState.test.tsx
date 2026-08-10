import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ErrorState } from "./ErrorState"

describe("ErrorState", () => {
  it("executa a tentativa novamente e renderiza a navegacao", () => {
    const retry = vi.fn()

    render(
      <ErrorState
        eyebrow="Erro"
        headingId="test-error"
        title="Falha ao carregar"
        description="Tente novamente."
        retry={retry}
        secondaryLink={{ href: "/", label: "Voltar" }}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))

    expect(retry).toHaveBeenCalledOnce()
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute(
      "href",
      "/"
    )
  })
})
