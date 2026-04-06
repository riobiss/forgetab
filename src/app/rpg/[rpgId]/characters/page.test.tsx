import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  fetchCharactersDashboardViewModel: vi.fn(),
  push: vi.fn(),
}))

vi.mock("@/infrastructure/charactersDashboard/repositories/httpCharactersDashboardRepository", () => ({
  fetchCharactersDashboardViewModel: mocks.fetchCharactersDashboardViewModel,
  HttpCharactersDashboardError: class HttpCharactersDashboardError extends Error {
    constructor(message: string, readonly status: number) {
      super(message)
      this.name = "HttpCharactersDashboardError"
    }
  },
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) => (
    <span aria-label={alt ?? ""} data-src={src ?? ""} role="img" />
  ),
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
  usePathname: () => "/rpg/rpg-1/characters",
  useRouter: () => ({
    push: mocks.push,
    refresh: vi.fn(),
  }),
  useSearchParams: () => {
    const params = new URLSearchParams()
    return {
      get: (key: string) => params.get(key),
      toString: () => params.toString(),
    }
  },
}))

import CharactersPage from "./page"

describe("CharactersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchCharactersDashboardViewModel.mockResolvedValue({
      rpgId: "rpg-1",
      rpgName: "Campanha",
      filterType: "all",
      canCreateCharacter: true,
      isOwner: false,
      canManageNpcMonster: false,
      isAcceptedMember: true,
      ownPlayerCount: 1,
      allowMultiplePlayerCharacters: false,
      characters: [
        {
          id: "c1",
          name: "Player 1",
          image: null,
          characterType: "player",
          createdByUserId: "user-1",
        },
      ],
      selectedCharacterDetail: null,
      editorBootstrap: null,
    })
  })

  it("nao mostra criacao extra para membro com player existente quando multiplos estao desabilitados", async () => {
    render(
      await CharactersPage({
        params: Promise.resolve({ rpgId: "rpg-1" }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(
      screen.queryByRole("link", { name: "Criar outro personagem" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Criar personagem" })).not.toBeInTheDocument()
  })

  it("mostra criacao extra para membro com player existente quando multiplos estao habilitados", async () => {
    mocks.fetchCharactersDashboardViewModel.mockResolvedValueOnce({
      rpgId: "rpg-1",
      rpgName: "Campanha",
      filterType: "all",
      canCreateCharacter: true,
      isOwner: false,
      canManageNpcMonster: false,
      isAcceptedMember: true,
      ownPlayerCount: 1,
      allowMultiplePlayerCharacters: true,
      characters: [
        {
          id: "c1",
          name: "Player 1",
          image: null,
          characterType: "player",
          createdByUserId: "user-1",
        },
      ],
      selectedCharacterDetail: null,
      editorBootstrap: null,
    })

    render(
      await CharactersPage({
        params: Promise.resolve({ rpgId: "rpg-1" }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(
      screen.getByRole("link", { name: "Criar outro personagem" }),
    ).toBeInTheDocument()
  })
})
