import { render, screen, waitFor } from "@testing-library/react"
import { usePathname } from "next/navigation"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AuthHeader from "./AuthHeader"

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }))

describe("AuthHeader", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReset()
    window.history.replaceState({}, "", "/")
  })

  it("exibe Notas com o id da campanha atual", () => {
    vi.mocked(usePathname).mockReturnValue("/rpg/rpg-1/notes")
    render(<AuthHeader />)

    expect(screen.getByRole("link", { name: "Notas" })).toHaveAttribute(
      "href",
      "/rpg/rpg-1/notes"
    )
  })

  it("nao cria link de notas na rota de nova campanha", () => {
    vi.mocked(usePathname).mockReturnValue("/rpg/new")
    render(<AuthHeader />)

    expect(screen.queryByRole("link", { name: "Notas" })).toBeNull()
  })

  it("salva a pagina atual no link de notas", () => {
    vi.mocked(usePathname).mockReturnValue("/rpg/rpg-1/skills")
    render(<AuthHeader />)

    expect(screen.getByRole("link", { name: "Notas" })).toHaveAttribute(
      "href",
      "/rpg/rpg-1/notes?returnTo=%2Frpg%2Frpg-1%2Fskills"
    )
  })

  it("exibe no header um atalho para a pagina anterior", async () => {
    window.history.replaceState(
      {},
      "",
      "/rpg/rpg-1/notes?returnTo=%2Frpg%2Frpg-1%2Fcharacters"
    )
    vi.mocked(usePathname).mockReturnValue("/rpg/rpg-1/notes")
    render(<AuthHeader />)

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Personagens" })).toHaveAttribute(
        "href",
        "/rpg/rpg-1/characters"
      )
    )
  })
})
